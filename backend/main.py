import os
import subprocess
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

def download_audio_from_youtube(url: str, output_filename: str = "temp_audio"):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{output_filename}.%(ext)s',
        'postprocessors':[{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'm4a',
            'preferredquality': '128',
        }],
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        return f"{output_filename}.m4a"
    except Exception as e:
        raise Exception(f"Error descargando audio: {str(e)}")

@app.post("/api/v1/analyze-pitch")
async def analyze_pitch(request: PitchRequest):
    audio_path = None
    try:
        # 1. DESCARGAR Y EXTRAER AUDIO
        print("Descargando audio del pitch...")
        audio_path = download_audio_from_youtube(request.youtube_url)
        
        # 2. DIMENSIÓN VERBAL (Groq + Whisper)
        print("Enviando audio a Groq (Whisper-large-v3)...")
        with open(audio_path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(audio_path, file.read()),
                model="whisper-large-v3",
                prompt="El siguiente es un pitch de innovación o emprendimiento en español.",
                response_format="json",
                language="es"
            )
        
        pitch_text = transcription.text
        
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
                "transcription": pitch_text,
                "content_evaluation": evaluacion_contenido
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Limpiar el archivo temporal
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)