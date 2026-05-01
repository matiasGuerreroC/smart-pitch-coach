import os
import subprocess
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import yt_dlp

# Cargar variables de entorno
load_dotenv()

# Inicializar cliente de Groq
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="AIPitch - Backend MVP")

# Modelo de datos para recibir la URL
class PitchRequest(BaseModel):
    youtube_url: str

# Función auxiliar para descargar audio de YouTube
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
        # 1. DESCARGAR Y EXTRAER AUDIO (Simulando el MP4 que subirá el usuario)
        print("Descargando audio del pitch...")
        audio_path = download_audio_from_youtube(request.youtube_url)
        
        # 2. DIMENSIÓN VERBAL (Groq + Whisper)
        print("Enviando audio a Groq (Whisper-large-v3)...")
        with open(audio_path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(audio_path, file.read()),
                model="whisper-large-v3",
                prompt="El siguiente es un pitch de innovación o emprendimiento en español. Contiene muletillas.",
                response_format="json",
                language="es"
            )
        
        pitch_text = transcription.text
        
        # TODO: 3. DIMENSIÓN CONTENIDO (Gemini RAG) - Lo haremos después
        # TODO: 4. DIMENSIÓN NO VERBAL (Gemini Multimodal / MediaPipe)
        
        return {
            "status": "success",
            "message": "Dimensión Verbal procesada con éxito",
            "data": {
                "transcription": pitch_text
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Limpiar el archivo temporal para no llenar el disco
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)