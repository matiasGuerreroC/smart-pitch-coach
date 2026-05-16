from __future__ import annotations

import os
import subprocess
import uuid
from datetime import datetime
from typing import Any, Dict
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import google.generativeai as genai
import yt_dlp
from fastapi.responses import FileResponse
from pathlib import Path
import cv2
from PIL import Image


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


class PitchRequest(BaseModel):
    youtube_url: str


class AnalysisStartRequest(BaseModel):
    youtube_url: str


ANALYSIS_SESSIONS: Dict[str, Dict[str, Any]] = {}
URL_TO_ANALYSIS_ID: Dict[str, str] = {}

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
            "analyze_pitch": "POST /api/v1/analyze-pitch",
            "analysis_start": "POST /api/v1/analysis/start",
            "analysis_step": "POST /api/v1/analysis/{analysis_id}/{transcription|verbal-metrics|content|nonverbal}",
            "analysis_state": "GET /api/v1/analysis/{analysis_id}",
            "analysis_close": "DELETE /api/v1/analysis/{analysis_id}",
        }
    }


@app.get("/debug")
async def debug_frontend():
    """Frontend de debug para probar los endpoints de forma intuitiva"""
    return FileResponse(DEBUG_DIR / "index.html")


@app.post("/api/v1/analysis/start")
async def start_analysis(request: AnalysisStartRequest):
    existing_id = URL_TO_ANALYSIS_ID.get(request.youtube_url)
    if existing_id and existing_id in ANALYSIS_SESSIONS:
        session = ANALYSIS_SESSIONS[existing_id]
        return _build_step_response(session, "Sesión reutilizada para esta URL", cached=True)

    analysis_id = str(uuid.uuid4())
    nombre_archivo = f"temp_audio_{analysis_id}"
    nombre_video = f"temp_video_{analysis_id}"

    video_metadata = fetch_video_metadata(request.youtube_url)
    raw_audio_path = download_audio_from_youtube(request.youtube_url, output_filename=nombre_archivo)
    audio_path = normalize_audio_for_whisper(raw_audio_path)
    raw_video_path = download_video_from_youtube(request.youtube_url, output_filename=nombre_video)

    session = {
        "analysis_id": analysis_id,
        "youtube_url": request.youtube_url,
        "created_at": datetime.utcnow().isoformat(),
        "raw_audio_path": raw_audio_path,
        "audio_path": audio_path,
        "raw_video_path": raw_video_path,
        "video_metadata": video_metadata,
        "transcription": None,
        "transcription_segments": [],
        "transcription_words": [],
        "verbal_metrics": None,
        "content_evaluation": None,
        "nonverbal_evaluation": None,
        "steps": {
            "prepared": True,
            "transcription": False,
            "verbal_metrics": False,
            "content": False,
            "nonverbal": False,
        },
    }

    ANALYSIS_SESSIONS[analysis_id] = session
    URL_TO_ANALYSIS_ID[request.youtube_url] = analysis_id
    return _build_step_response(session, "Sesión creada. Ejecuta los pasos manualmente")


@app.post("/api/v1/analysis/{analysis_id}/transcription")
async def run_transcription(analysis_id: str):
    session = _get_session_or_404(analysis_id)
    cached = session["steps"]["transcription"]
    try:
        if not cached:
            _run_transcription_step(session)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return _build_step_response(session, "Paso transcripción completado" if not cached else "Paso transcripción en caché", cached=cached)


@app.post("/api/v1/analysis/{analysis_id}/verbal-metrics")
async def run_verbal_metrics(analysis_id: str):
    session = _get_session_or_404(analysis_id)
    cached = session["steps"]["verbal_metrics"]
    try:
        if not cached:
            _run_verbal_metrics_step(session)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return _build_step_response(session, "Paso métricas verbales completado" if not cached else "Paso métricas verbales en caché", cached=cached)


# Compatibilidad con el flujo anterior
@app.post("/api/v1/analysis/{analysis_id}/verbal")
async def run_verbal_legacy(analysis_id: str):
    session = _get_session_or_404(analysis_id)
    cached = session["steps"]["transcription"] and session["steps"]["verbal_metrics"]
    try:
        if not session["steps"]["transcription"]:
            _run_transcription_step(session)
        if not session["steps"]["verbal_metrics"]:
            _run_verbal_metrics_step(session)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return _build_step_response(session, "Paso verbal legacy completado" if not cached else "Paso verbal legacy en caché", cached=cached)


@app.post("/api/v1/analysis/{analysis_id}/content")
async def run_content(analysis_id: str):
    session = _get_session_or_404(analysis_id)
    cached = session["steps"]["content"]
    try:
        if not cached:
            _run_content_step(session)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return _build_step_response(session, "Paso contenido completado" if not cached else "Paso contenido en caché", cached=cached)


@app.post("/api/v1/analysis/{analysis_id}/nonverbal")
async def run_nonverbal(analysis_id: str):
    session = _get_session_or_404(analysis_id)
    cached = session["steps"]["nonverbal"]
    try:
        if not cached:
            _run_nonverbal_step(session)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return _build_step_response(session, "Paso no verbal completado" if not cached else "Paso no verbal en caché", cached=cached)


@app.get("/api/v1/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    session = _get_session_or_404(analysis_id)
    return _build_step_response(session, "Estado actual de la sesión")


@app.delete("/api/v1/analysis/{analysis_id}")
async def close_analysis(analysis_id: str):
    session = _get_session_or_404(analysis_id)
    _cleanup_session_files(session)
    URL_TO_ANALYSIS_ID.pop(session["youtube_url"], None)
    ANALYSIS_SESSIONS.pop(analysis_id, None)
    return {"status": "success", "message": "Sesión cerrada y archivos temporales eliminados"}


def _build_step_response(session: Dict[str, Any], message: str, cached: bool = False) -> Dict[str, Any]:
    next_step = _get_next_step(session)
    return {
        "status": "success",
        "message": message,
        "analysis_id": session["analysis_id"],
        "cached": cached,
        "steps": session["steps"],
        "next_step": next_step,
        "data": {
            "video_metadata": session["video_metadata"],
            "transcription": session["transcription"],
            "transcription_segments": session["transcription_segments"],
            "transcription_words": session["transcription_words"],
            "verbal_metrics": session["verbal_metrics"],
            "content_evaluation": session["content_evaluation"],
            "nonverbal_evaluation": session["nonverbal_evaluation"],
        },
    }


def _get_session_or_404(analysis_id: str) -> Dict[str, Any]:
    session = ANALYSIS_SESSIONS.get(analysis_id)
    if not session:
        raise HTTPException(status_code=404, detail="analysis_id no encontrado")
    return session


def _get_next_step(session: Dict[str, Any]) -> str | None:
    steps = session["steps"]
    if not steps["transcription"]:
        return "transcription"
    if not steps["verbal_metrics"]:
        return "verbal-metrics"
    if not steps["content"]:
        return "content"
    if not steps["nonverbal"]:
        return "nonverbal"
    return None


def _cleanup_session_files(session: Dict[str, Any]) -> None:
    for key in ["audio_path", "raw_audio_path", "raw_video_path"]:
        path = session.get(key)
        if path and os.path.exists(path):
            os.remove(path)


def _run_transcription_step(session: Dict[str, Any]) -> None:
    if session["steps"]["transcription"]:
        return

    video_metadata = session["video_metadata"]
    audio_path = session["audio_path"]

    whisper_context_prompt = (
        f"El siguiente es un pitch de innovación sobre {video_metadata.get('title', 'tecnología')}. "
        "El orador usa muletillas como eh, mmm, ah, o sea."
    )

    with open(audio_path, "rb") as file:
        transcription = groq_client.audio.transcriptions.create(
            file=(audio_path, file.read()),
            model="whisper-large-v3",
            prompt=whisper_context_prompt,
            temperature=0,
            response_format="verbose_json",
            language="es",
        )

    pitch_text = getattr(transcription, "text", "")
    segmentos = getattr(transcription, "segments", []) or []
    words = getattr(transcription, "words", []) or []

    segmentos_detallados = []
    for idx, segmento in enumerate(segmentos):
        texto_segmento = segmento.get("text", "").strip()
        segmentos_detallados.append({
            "indice": idx + 1,
            "inicio": round(segmento.get("start", 0), 2),
            "fin": round(segmento.get("end", 0), 2),
            "duracion_segundos": round(segmento.get("end", 0) - segmento.get("start", 0), 2),
            "texto": texto_segmento,
            "muletillas_detectadas": [],
        })

    palabras_con_tiempo = []
    for palabra in words:
        palabras_con_tiempo.append({
            "palabra": palabra.get("word", "").strip(),
            "inicio": round(palabra.get("start", 0), 2),
            "fin": round(palabra.get("end", 0), 2),
        })

    session["transcription"] = pitch_text
    session["transcription_segments"] = segmentos_detallados
    session["transcription_words"] = palabras_con_tiempo
    session["steps"]["transcription"] = True


def _run_verbal_metrics_step(session: Dict[str, Any]) -> None:
    if session["steps"]["verbal_metrics"]:
        return
    if not session.get("transcription"):
        raise HTTPException(status_code=400, detail="Primero ejecuta el paso transcripción")

    pitch_text = session["transcription"]
    segmentos = session.get("transcription_segments", []) or []

    total_palabras = len(pitch_text.split())
    duracion_segundos = segmentos[-1]["fin"] if segmentos else 0
    wpm = round((total_palabras / duracion_segundos) * 60) if duracion_segundos > 0 else 0

    silencios_largos = []
    for i in range(len(segmentos) - 1):
        fin_actual = segmentos[i]["fin"]
        inicio_siguiente = segmentos[i + 1]["inicio"]
        pausa = inicio_siguiente - fin_actual
        if pausa > 2.0:
            silencios_largos.append({
                "inicio": fin_actual,
                "duracion_segundos": round(pausa, 2),
            })

    muletillas_comunes = [" eh ", " este ", " mmm ", " o sea "]
    conteo_muletillas = sum(pitch_text.lower().count(m) for m in muletillas_comunes)

    for segmento in session["transcription_segments"]:
        texto_lower = (segmento.get("texto") or "").lower()
        segmento["muletillas_detectadas"] = [m.strip() for m in muletillas_comunes if m.strip() in texto_lower]

    session["verbal_metrics"] = {
        "palabras_por_minuto": wpm,
        "nivel_velocidad": "Óptimo" if 130 <= wpm <= 160 else "Muy rápido" if wpm > 160 else "Muy lento",
        "cantidad_muletillas": conteo_muletillas,
        "silencios_largos": silencios_largos,
    }
    session["steps"]["verbal_metrics"] = True


def _run_content_step(session: Dict[str, Any]) -> None:
    if session["steps"]["content"]:
        return
    if not session["steps"].get("transcription"):
        raise HTTPException(status_code=400, detail="Primero ejecuta el paso transcripción")

    prompt_evaluador = f"""
    Eres un juez estricto pero constructivo de un fondo concursable de innovación en Chile (tipo CORFO o ANID).
    Evalúa el siguiente texto de un pitch de emprendimiento.
    Devuelve tu análisis en formato JSON estructurado con las siguientes claves:
    - \"puntaje_global\": un número del 1 al 100.
    - \"puntos_fuertes\": un arreglo con 2 cosas buenas del discurso.
    - \"puntos_debiles\": un arreglo con 2 cosas que faltaron (ej. modelo de negocios, equipo, tracción).
    - \"recomendacion\": un párrafo corto con un consejo clave para mejorar.

    Texto del pitch:
    \"{session['transcription']}\"
    """
    respuesta_gemini = gemini_model.generate_content(prompt_evaluador)
    session["content_evaluation"] = respuesta_gemini.text
    session["steps"]["content"] = True


def _run_nonverbal_step(session: Dict[str, Any]) -> None:
    if session["steps"]["nonverbal"]:
        return
    if not session["steps"].get("content"):
        raise HTTPException(status_code=400, detail="Primero ejecuta el paso contenido")
    session["nonverbal_evaluation"] = analyze_nonverbal_with_gemini(session["raw_video_path"])
    session["steps"]["nonverbal"] = True


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


def download_video_from_youtube(url: str, output_filename: str = "temp_video") -> str:
    ydl_opts = {
        'noplaylist': True,
        'format': 'best[ext=mp4]/best',
        'merge_output_format': 'mp4',
        'outtmpl': f'{output_filename}.%(ext)s',
        'quiet': True,
        'no_warnings': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        base_path = Path(output_filename)
        video_extensions = {'.mp4', '.mkv', '.webm', '.mov', '.avi'}
        candidates = [
            path for path in base_path.parent.glob(f"{base_path.name}.*")
            if path.suffix.lower() in video_extensions
        ]
        if not candidates:
            raise Exception("No se encontró el archivo de video descargado")
        return str(candidates[0])
    except Exception as e:
        raise Exception(f"Error descargando video: {str(e)}")


def extract_audio_from_video(video_path: str, output_filename: str = "temp_audio") -> str:
    """Extrae el audio del video local a WAV (pcm_s16le) usando ffmpeg."""
    out_path = f"{output_filename}.wav"
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-acodec",
        "pcm_s16le",
        out_path,
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Error extrayendo audio del video: {result.stderr.strip()}")
    return out_path


def get_video_duration_seconds(video_path: str) -> float:
    try:
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return 0.0
        fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
        total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0.0
        cap.release()
        return (total_frames / fps) if fps else 0.0
    except Exception:
        return 0.0


def sample_video_frames(video_path: str, max_frames: int = 6, max_seconds: int = 30):
    capture = cv2.VideoCapture(video_path)
    if not capture.isOpened():
        raise Exception("No se pudo abrir el video para análisis no verbal")

    fps = capture.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    duration_seconds = total_frames / fps if fps else 0
    usable_seconds = min(max_seconds, duration_seconds) if duration_seconds else max_seconds
    frames_to_sample = max(1, min(max_frames, int(usable_seconds)))

    sampled_frames = []
    timestamps = []
    if frames_to_sample == 1:
        timestamps = [0.0]
    else:
        timestamps = [
            round((usable_seconds * idx) / (frames_to_sample - 1), 2)
            for idx in range(frames_to_sample)
        ]

    for timestamp in timestamps:
        capture.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)
        success, frame = capture.read()
        if not success or frame is None:
            continue

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        sampled_frames.append({
            "timestamp": timestamp,
            "image": Image.fromarray(rgb_frame),
        })

    capture.release()
    return sampled_frames, duration_seconds


def analyze_nonverbal_with_gemini(video_path: str) -> dict:
    try:
        sampled_frames, duration_seconds = sample_video_frames(video_path)
        if not sampled_frames:
            return {
                "available": False,
                "reason": "No se pudieron extraer frames útiles del video",
            }

        frame_notes = "\n".join([
            f"- Frame {idx + 1}: segundo {frame['timestamp']}"
            for idx, frame in enumerate(sampled_frames)
        ])

        prompt_no_verbal = f"""
        Eres un analista estricto de lenguaje no verbal para pitches de emprendimiento.
        Observa únicamente lo visible en los frames del video y evalúa:
        - postura general
        - contacto visual
        - expresión facial
        - uso de manos/gestos
        - nivel de confianza percibido

        Devuelve un JSON válido con estas claves:
        - "puntaje_global": número del 1 al 100
        - "fortalezas": arreglo de 2 a 3 observaciones positivas
        - "debilidades": arreglo de 2 a 3 observaciones a mejorar
        - "recomendacion": un párrafo corto con la recomendación principal
        - "postura": texto breve
        - "contacto_visual": texto breve
        - "uso_manos": texto breve
        - "expresion_facial": texto breve
        - "nivel_confianza": texto breve

        Duración total estimada del video: {round(duration_seconds, 2)} segundos
        Frames muestreados:
        {frame_notes}
        """.strip()

        response = gemini_model.generate_content([prompt_no_verbal, *[frame["image"] for frame in sampled_frames]])
        return {
            "available": True,
            "frames_sampled": len(sampled_frames),
            "duration_seconds": round(duration_seconds, 2),
            "analysis": response.text,
        }
    except Exception as e:
        return {
            "available": False,
            "reason": str(e),
        }

@app.post("/api/v1/analyze-pitch")
async def analyze_pitch(request: PitchRequest):
    audio_path = None
    raw_audio_path = None
    raw_video_path = None
    video_metadata = None
    nonverbal_evaluation = None
    try:
        # 1. DESCARGAR Y EXTRAER AUDIO
        print("Descargando audio del pitch...")
        
        # Generar un ID único (ej: '550e8400-e29b-41d4-a716-446655440000')
        id_unico = str(uuid.uuid4())
        nombre_archivo = f"temp_audio_{id_unico}"
        nombre_video = f"temp_video_{id_unico}"

        video_metadata = fetch_video_metadata(request.youtube_url)

        raw_video_path = download_video_from_youtube(request.youtube_url, output_filename=nombre_video)
        nonverbal_evaluation = analyze_nonverbal_with_gemini(raw_video_path)
        
        raw_audio_path = download_audio_from_youtube(request.youtube_url, output_filename=nombre_archivo)
        audio_path = normalize_audio_for_whisper(raw_audio_path)
        
        # 2. DIMENSIÓN VERBAL (Groq + Whisper)
        print("Enviando audio a Groq (Whisper-large-v3)...")
        
        whisper_context_prompt = f"El siguiente es un pitch de innovación sobre {video_metadata.get('title', 'tecnología')}. El orador usa muletillas como eh, mmm, ah, o sea."
        
        with open(audio_path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(audio_path, file.read()),
                model="whisper-large-v3",
                prompt=whisper_context_prompt,
                temperature=0,
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
                "verbal_metrics": metricas_verbales,
                "nonverbal_evaluation": nonverbal_evaluation,
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
        if raw_video_path and os.path.exists(raw_video_path):
            os.remove(raw_video_path)


@app.post("/api/v1/analysis/upload")
async def start_analysis_upload(file: UploadFile = File(...)):
    """Crear una sesión de análisis a partir de un video subido localmente."""
    analysis_id = str(uuid.uuid4())
    suffix = Path(file.filename).suffix or ".mp4"
    raw_video_name = f"temp_video_{analysis_id}{suffix}"
    raw_audio_name = f"temp_audio_{analysis_id}.wav"

    raw_video_path = str(BASE_DIR / raw_video_name)
    raw_audio_path = None
    audio_path = None

    try:
        # Guardar archivo subido en disco
        with open(raw_video_path, "wb") as out_f:
            content = await file.read()
            out_f.write(content)

        # Extraer audio y normalizar para Whisper
        raw_audio_path = extract_audio_from_video(raw_video_path, output_filename=str(BASE_DIR / f"temp_audio_{analysis_id}"))
        audio_path = normalize_audio_for_whisper(raw_audio_path)

        # Construir metadata básica
        duration = get_video_duration_seconds(raw_video_path)
        video_metadata = {
            "title": file.filename,
            "description": "Archivo subido localmente",
            "channel": "local",
            "duration_seconds": round(duration, 2),
            "webpage_url": f"local://{file.filename}",
        }

        session = {
            "analysis_id": analysis_id,
            "youtube_url": f"local://{file.filename}",
            "created_at": datetime.utcnow().isoformat(),
            "raw_audio_path": raw_audio_path,
            "audio_path": audio_path,
            "raw_video_path": raw_video_path,
            "video_metadata": video_metadata,
            "transcription": None,
            "transcription_segments": [],
            "transcription_words": [],
            "verbal_metrics": None,
            "content_evaluation": None,
            "nonverbal_evaluation": None,
            "steps": {
                "prepared": True,
                "transcription": False,
                "verbal_metrics": False,
                "content": False,
                "nonverbal": False,
            },
        }

        ANALYSIS_SESSIONS[analysis_id] = session
        return _build_step_response(session, "Sesión creada desde archivo local. Ejecuta los pasos manualmente.")

    except Exception as e:
        # Intentar eliminar archivos si algo falla
        if raw_audio_path and os.path.exists(raw_audio_path):
            os.remove(raw_audio_path)
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        if raw_video_path and os.path.exists(raw_video_path):
            os.remove(raw_video_path)
        raise HTTPException(status_code=500, detail=str(e))