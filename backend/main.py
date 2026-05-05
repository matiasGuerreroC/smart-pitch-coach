import os
import subprocess
import uuid
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import google.generativeai as genai
import yt_dlp
from fastapi.responses import FileResponse
from pathlib import Path


# Cargar variables de entorno

load_dotenv()

# 1. Inicializar cliente de Groq (Voz)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# 2. Inicializar cliente de Gemini (Cognitivo)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# Usamos flash porque es ultrarrápido y barato
gemini_model = genai.GenerativeModel('gemini-2.5-flash') 

app = FastAPI(title="AIPitch - Backend MVP")

# Obtener ruta del directorio actual
BASE_DIR = Path(__file__).resolve().parent
DEBUG_DIR = BASE_DIR / "debug"

# ============================================================================
# RUTAS DEBUG Y RAÍZ
# ============================================================================

@app.get("/")
async def root():
    """Endpoint raíz con información de la API"""
    return {
        "message": "AIPitch Backend API",
        "version": "1.0.0",
        "debug": "http://localhost:8000/debug",
        "endpoints": {
            "debug": "GET /debug",
            "analyze_pitch": "POST /api/v1/analyze-pitch"
        }
    }


@app.get("/debug")
async def debug_frontend():
    """Frontend de debug para probar los endpoints de forma intuitiva"""
    return FileResponse(DEBUG_DIR / "index.html")

class PitchRequest(BaseModel):
    youtube_url: str


def fetch_video_metadata(url: str) -> dict:
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        return {
            "title": info.get("title", ""),
            "description": info.get("description", ""),
            "channel": info.get("uploader", info.get("channel", "")),
            "duration_seconds": info.get("duration", 0),
            "webpage_url": info.get("webpage_url", url),
        }
    except Exception as e:
        print(f"No se pudo obtener metadata del video: {e}")
        return {
            "title": "",
            "description": "",
            "channel": "",
            "duration_seconds": 0,
            "webpage_url": url,
        }

def download_audio_from_youtube(url: str, output_filename: str = "temp_audio"):
    ydl_opts = {
        'noplaylist': True,
        'format': 'bestaudio/best',
        'outtmpl': f'{output_filename}.%(ext)s',
        'postprocessors':[{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '0',
        }],
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        return f"{output_filename}.wav"
    except Exception as e:
        raise Exception(f"Error descargando audio: {str(e)}")


def normalize_audio_for_whisper(source_path: str) -> str:
    normalized_path = source_path.replace(".wav", ".whisper.mp3") # <--- Cambiado a mp3
    command =[
        "ffmpeg",
        "-y",
        "-i", source_path,
        "-ac", "1",           # 1 Canal (Mono)
        "-ar", "16000",       # 16000 Hz
        "-b:a", "64k",        # Bitrate bajo, 64kbps es perfecto para voz
        "-vn",                # Quitar video por si acaso
        normalized_path,
    ]

    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Error normalizando audio para Whisper: {result.stderr.strip()}")

    return normalized_path

@app.post("/api/v1/analyze-pitch")
async def analyze_pitch(request: PitchRequest):
    audio_path = None
    raw_audio_path = None
    video_metadata = None
    try:
        # 1. DESCARGAR Y EXTRAER AUDIO
        print("Descargando audio del pitch...")
        
        # Generar un ID único (ej: '550e8400-e29b-41d4-a716-446655440000')
        id_unico = str(uuid.uuid4())
        nombre_archivo = f"temp_audio_{id_unico}"

        video_metadata = fetch_video_metadata(request.youtube_url)
        
        raw_audio_path = download_audio_from_youtube(request.youtube_url, output_filename=nombre_archivo)
        audio_path = normalize_audio_for_whisper(raw_audio_path)
        
        # 2. DIMENSIÓN VERBAL (Groq + Whisper)
        print("Enviando audio a Groq (Whisper-large-v3)...")
        with open(audio_path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(audio_path, file.read()),
                model="whisper-large-v3",
                prompt=f"""Transcribe con fidelidad este video de YouTube en español.
Título: {video_metadata.get('title', '')}
Canal: {video_metadata.get('channel', '')}
Descripción: {video_metadata.get('description', '')[:800]}

Reglas:
- conserva muletillas, repeticiones y reformulaciones
- no corrijas el estilo oral del hablante
- respeta el orden real de lo dicho
- si hay términos del contexto del video, úsalos para mejorar la fidelidad de la transcripción
- el contenido parece ser un pitch o presentación oral, así que prioriza precisión semántica y literalidad
""",
                response_format="verbose_json", 
                language="es"
            )
        
        pitch_text = getattr(transcription, "text", "")
        segmentos = getattr(transcription, "segments", []) or [] # Aquí viene la lista con los tiempos
        words = getattr(transcription, "words", []) or []
        
        # --- CÁLCULO DE MÉTRICAS VERBALES ---
        total_palabras = len(pitch_text.split())
        duracion_segundos = segmentos[-1]["end"] if segmentos else 0 # Cuándo termina el último segmento
        
        # 1. Velocidad de habla (Words Per Minute)
        wpm = round((total_palabras / duracion_segundos) * 60) if duracion_segundos > 0 else 0
        
        # 2. Detección de silencios largos (Pausas > 2 segundos)
        silencios_largos =[]
        for i in range(len(segmentos) - 1):
            fin_actual = segmentos[i]["end"]
            inicio_siguiente = segmentos[i+1]["start"]
            pausa = inicio_siguiente - fin_actual
            if pausa > 2.0: # Si se queda callado más de 2 segundos
                silencios_largos.append({
                    "inicio": fin_actual,
                    "duracion_segundos": round(pausa, 2)
                })

        # 3. Conteo rápido de muletillas (Aproximación basada en texto)
        muletillas_comunes = [" eh ", " este ", " mmm ", " o sea "]
        conteo_muletillas = sum(pitch_text.lower().count(m) for m in muletillas_comunes)

        segmentos_detallados = []
        for idx, segmento in enumerate(segmentos):
            texto_segmento = segmento.get("text", "").strip()
            texto_lower = texto_segmento.lower()
            muletillas_en_segmento = [m.strip() for m in muletillas_comunes if m.strip() in texto_lower]
            segmentos_detallados.append({
                "indice": idx + 1,
                "inicio": round(segmento.get("start", 0), 2),
                "fin": round(segmento.get("end", 0), 2),
                "duracion_segundos": round(segmento.get("end", 0) - segmento.get("start", 0), 2),
                "texto": texto_segmento,
                "muletillas_detectadas": muletillas_en_segmento,
            })

        palabras_con_tiempo = []
        for palabra in words:
            palabras_con_tiempo.append({
                "palabra": palabra.get("word", "").strip(),
                "inicio": round(palabra.get("start", 0), 2),
                "fin": round(palabra.get("end", 0), 2),
            })

        metricas_verbales = {
            "palabras_por_minuto": wpm,
            "nivel_velocidad": "Óptimo" if 130 <= wpm <= 160 else "Muy rápido" if wpm > 160 else "Muy lento",
            "cantidad_muletillas": conteo_muletillas,
            "silencios_largos": silencios_largos
        }
        
        # 3. DIMENSIÓN CONTENIDO (Gemini)
        print("Evaluando contenido con Gemini...")
        
        # Este es nuestro "System Prompt" que le da personalidad de Jurado
        prompt_evaluador = f"""
        Eres un juez estricto pero constructivo de un fondo concursable de innovación en Chile (tipo CORFO o ANID).
        Evalúa el siguiente texto de un pitch de emprendimiento. 
        Devuelve tu análisis en formato JSON estructurado con las siguientes claves:
        - "puntaje_global": un número del 1 al 100.
        - "puntos_fuertes": un arreglo con 2 cosas buenas del discurso.
        - "puntos_debiles": un arreglo con 2 cosas que faltaron (ej. modelo de negocios, equipo, tracción).
        - "recomendacion": un párrafo corto con un consejo clave para mejorar.

        Texto del pitch:
        "{pitch_text}"
        """
        
        # Llamada a la API de Gemini
        respuesta_gemini = gemini_model.generate_content(prompt_evaluador)
        evaluacion_contenido = respuesta_gemini.text
        
        # TODO: 4. DIMENSIÓN NO VERBAL (Postura/Manos) - Próximo paso
        
        return {
            "status": "success",
            "message": "Análisis Verbal y de Contenido procesados con éxito",
            "data": {
                "video_metadata": video_metadata,
                "transcription": pitch_text,
                "transcription_segments": segmentos_detallados,
                "transcription_words": palabras_con_tiempo,
                "content_evaluation": evaluacion_contenido,
                "verbal_metrics": metricas_verbales
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Limpiar el archivo temporal
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        if raw_audio_path and os.path.exists(raw_audio_path):
            os.remove(raw_audio_path)