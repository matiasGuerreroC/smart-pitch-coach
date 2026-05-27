from __future__ import annotations

import json
import os
import subprocess
import uuid
import time
from datetime import datetime
from typing import Any, Dict, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import imageio_ffmpeg
from google import genai
import yt_dlp
from fastapi.responses import FileResponse
from pathlib import Path
import cv2
from PIL import Image

import fitz
import docx
from sqlalchemy.orm import Session
from vectorialDB import init_db, get_db, Rubrica, RubricaChunk

# Cargar variables de entorno
load_dotenv()

# 1. Inicializar cliente de Groq (Voz)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# 2. Inicializar cliente de Gemini (Cognitivo)
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI(title="AIPitch - Backend MVP")

# Inicializar Base de Datos en Neon
init_db()

# ============================================================================
# CONFIGURACIÓN CORS
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Obtener ruta del directorio actual
BASE_DIR = Path(__file__).resolve().parent
DEBUG_DIR = BASE_DIR / "debug"

class PitchRequest(BaseModel):
    youtube_url: str

class AnalysisStartRequest(BaseModel):
    youtube_url: str
    rubric_id: Optional[str] = None

class RubricCreateRequest(BaseModel):
    name: str
    description: str
    criteria: Optional[list[str]] = None

ANALYSIS_SESSIONS: Dict[str, Dict[str, Any]] = {}
URL_TO_ANALYSIS_ID: Dict[str, str] = {}
ANALYSIS_HISTORY: Dict[str, Dict[str, Any]] = {}

HISTORY_PATH = DEBUG_DIR / "analysis_history.json"

def _load_history_from_disk() -> Dict[str, Dict[str, Any]]:
    if not HISTORY_PATH.exists():
        return {}
    try:
        with open(HISTORY_PATH, "r", encoding="utf-8") as handle:
            raw = json.load(handle)
        if isinstance(raw, dict):
            return raw
    except Exception as exc:
        print(f"No se pudo cargar history: {exc}")
    return {}

def _persist_history_to_disk() -> None:
    try:
        with open(HISTORY_PATH, "w", encoding="utf-8") as handle:
            json.dump(ANALYSIS_HISTORY, handle, ensure_ascii=False, indent=2)
    except Exception as exc:
        print(f"No se pudo guardar history: {exc}")

ANALYSIS_HISTORY.update(_load_history_from_disk())

def _extract_score_from_content(content_evaluation: Optional[str]) -> int:
    if not content_evaluation:
        return 0
    try:
        if isinstance(content_evaluation, dict):
            score = content_evaluation.get("puntaje_global")
            return int(score) if str(score).isdigit() else 0
            
        start = content_evaluation.find("{")
        end = content_evaluation.rfind("}")
        if start == -1 or end == -1:
            return 0
        payload = json.loads(content_evaluation[start:end + 1])
        score = payload.get("puntaje_global")
        return int(score) if isinstance(score, (int, float, str)) and str(score).isdigit() else 0
    except Exception:
        return 0

def _save_analysis_record(analysis_id: str, video_metadata: Dict[str, Any], source_url: str, rubric_id: Optional[str]) -> None:
    rubric_name = "Rúbrica Desconocida"
    if rubric_id:
        db_session = next(get_db())
        try:
            r = db_session.query(Rubrica).filter(Rubrica.id == rubric_id).first()
            if r:
                rubric_name = r.name
        finally:
            db_session.close()

    ANALYSIS_HISTORY[analysis_id] = {
        "analysis_id": analysis_id,
        "title": video_metadata.get("title", ""),
        "created_at": datetime.utcnow().isoformat(),
        "source_url": source_url,
        "rubric_id": rubric_id,
        "rubric_name": rubric_name,
        "status": "created",
        "steps": {},
        "score": 0,
    }
    _persist_history_to_disk()

def _update_analysis_steps(analysis_id: str, steps: Dict[str, Any]) -> None:
    if analysis_id in ANALYSIS_HISTORY:
        ANALYSIS_HISTORY[analysis_id]["steps"] = steps
        all_done = all(steps.get(key) for key in ["transcription", "verbal_metrics", "content", "nonverbal"])
        ANALYSIS_HISTORY[analysis_id]["status"] = "completed" if all_done else "processing"
        session = ANALYSIS_SESSIONS.get(analysis_id)
        if session:
            ANALYSIS_HISTORY[analysis_id]["score"] = _extract_score_from_content(session.get("content_evaluation"))
            if not ANALYSIS_HISTORY[analysis_id].get("title"):
                ANALYSIS_HISTORY[analysis_id]["title"] = session.get("video_metadata", {}).get("title", "")
        _persist_history_to_disk()

def _list_analysis_records() -> list[Dict[str, Any]]:
    records = list(ANALYSIS_HISTORY.values())
    return sorted(records, key=lambda r: r.get("created_at", ""), reverse=True)

# ============================================================================
# RAG: GESTOR DE RÚBRICAS VECTORIALES (NEON DB)
# ============================================================================

def get_embedding(texto: str) -> list[float]:
    """Convierte texto en vectores matemáticos con Gemini"""
    response = gemini_client.models.embed_content(
        model="gemini-embedding-2",
        contents=texto
    )
    return response.embeddings[0].values

@app.get("/api/v1/rubrics")
async def get_rubrics(db: Session = Depends(get_db)):
    """Devuelve la lista de rúbricas reales desde Neon DB"""
    rubricas_db = db.query(Rubrica).all()
    return [{"id": r.id, "name": r.name, "description": r.description} for r in rubricas_db]

@app.post("/api/v1/rubrics")
async def create_rubric(payload: RubricCreateRequest, db: Session = Depends(get_db)):
    """Mantiene la compatibilidad con el front de Nico para rúbricas manuales"""
    rubric_id = str(uuid.uuid4())
    db.add(Rubrica(id=rubric_id, name=payload.name.strip(), description=payload.description.strip()))
    
    texto_criterios = " ".join(payload.criteria or [])
    if texto_criterios:
        vector = get_embedding(texto_criterios)
        db.add(RubricaChunk(rubric_id=rubric_id, texto=texto_criterios, embedding=vector))
        
    db.commit()
    return {"id": rubric_id, "name": payload.name, "description": payload.description}

@app.post("/api/v1/rubrics/extract")
async def extract_rubrics(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Sube un PDF/Word ORIGINAL, extrae todo el texto, lo vectoriza y guarda en Neon"""
    rubric_id = str(uuid.uuid4())
    
    # Extraer texto del PDF directamente desde la memoria
    texto_completo = ""
    file_bytes = await file.read()
    
    try:
        if file.filename.endswith(".pdf"):
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc: 
                texto_completo += page.get_text("text") + "\n"
            doc.close()
        else:
            # Para DOCX u otros, guardamos temporal
            temp_path = f"temp_{file.filename}"
            with open(temp_path, "wb") as buffer:
                buffer.write(file_bytes)
            if file.filename.endswith(".docx"):
                doc = docx.Document(temp_path)
                for para in doc.paragraphs: 
                    texto_completo += para.text + "\n"
            os.remove(temp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo archivo: {str(e)}")
    
    if not texto_completo.strip():
        raise HTTPException(status_code=400, detail="Documento vacío o ilegible")

    # RAG INGESTION: Cortamos el PDF oficial en pedazos de 1500 caracteres
    chunks = [texto_completo[i:i+1500] for i in range(0, len(texto_completo), 1500)]    
    
    # RAG INGESTION: Generar vectores y guardar en Postgres
    db.add(Rubrica(id=rubric_id, name=f"Bases de {file.filename}", description="Documento oficial subido", is_default=False))
    
    print(f"Generando vectores para {len(chunks)} fragmentos...")
    
    for i, chunk in enumerate(chunks):
        for intento in range(3):
            try:
                vector = get_embedding(chunk)
                db.add(RubricaChunk(rubric_id=rubric_id, texto=chunk, embedding=vector))
                
                # Le damos un respiro de 1.5 segundos a la API gratuita de Google
                time.sleep(1.5) 
                print(f"Fragmento {i+1}/{len(chunks)} vectorizado.")
                break # Salió bien, rompemos el bucle de reintentos
                
            except Exception as e:
                if "429" in str(e):
                    print(f"⚠️ Ráfaga detectada por Google. Esperando 15s... (Intento {intento+1}/3)")
                    time.sleep(15)
                else:
                    raise e # Si es otro error, que explote normalmente
                    
    db.commit()
    print("¡Todos los fragmentos guardados en Neon!")
    
    db.commit()

    # Le pedimos a Gemini sugerencias SOLO para que la UI de Nico las muestre bonito
    criterios_prompt = f"Resume este texto en 4 criterios clave de evaluación cortos:\n{texto_completo[:2500]}"
    try:
        resp = gemini_client.models.generate_content(model="gemini-2.5-flash", contents=criterios_prompt)
        sugerencias = [c.strip().replace("-", "").replace("*", "") for c in resp.text.split('\n') if c.strip()]
    except:
        sugerencias = ["Problema", "Solución", "Mercado", "Equipo"]
    
    return {
        "id": rubric_id,
        "name": f"Bases de {file.filename}",
        "suggestedCriteria": sugerencias
    }


@app.get("/api/v1/analysis")
async def list_analysis_history():
    return _list_analysis_records()


@app.get("/api/v1/analysis/history/{analysis_id}")
async def get_analysis_history_detail(analysis_id: str):
    record = ANALYSIS_HISTORY.get(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="analysis_id no encontrado")
    return record

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

# ============================================================================
# FLUJO DE ANÁLISIS ASÍNCRONO
# ============================================================================

def fetch_video_metadata(url: str) -> dict:
    ydl_opts = {'quiet': True, 'no_warnings': True, 'skip_download': True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
        return {"title": info.get("title", ""), "description": info.get("description", ""), "channel": info.get("uploader", info.get("channel", "")), "duration_seconds": info.get("duration", 0), "webpage_url": info.get("webpage_url", url)}
    except Exception:
        return {"title": "", "description": "", "channel": "", "duration_seconds": 0, "webpage_url": url}

def download_audio_from_youtube(url: str, output_filename: str = "temp_audio"):
    ydl_opts = {'noplaylist': True, 'format': 'bestaudio/best', 'outtmpl': f'{output_filename}.%(ext)s', 'postprocessors':[{'key': 'FFmpegExtractAudio', 'preferredcodec': 'wav', 'preferredquality': '0'}]}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl: ydl.download([url])
        return f"{output_filename}.wav"
    except Exception as e: raise Exception(f"Error descargando audio: {str(e)}")

def normalize_audio_for_whisper(source_path: str) -> str:
    normalized_path = source_path.replace(".wav", ".whisper.mp3") 
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    command =[ffmpeg_exe, "-y", "-i", source_path, "-ac", "1", "-ar", "16000", "-b:a", "64k", "-vn", normalized_path]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0: raise Exception(f"Error normalizando audio: {result.stderr.strip()}")
    return normalized_path

def download_video_from_youtube(url: str, output_filename: str = "temp_video") -> str:
    ydl_opts = {'noplaylist': True, 'format': 'best[ext=mp4]/best', 'merge_output_format': 'mp4', 'outtmpl': f'{output_filename}.%(ext)s', 'quiet': True, 'no_warnings': True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl: ydl.download([url])
        base_path = Path(output_filename)
        candidates = [p for p in base_path.parent.glob(f"{base_path.name}.*") if p.suffix.lower() in {'.mp4', '.mkv', '.webm', '.mov', '.avi'}]
        if not candidates: raise Exception("No se encontró el video")
        return str(candidates[0])
    except Exception as e: raise Exception(f"Error descargando video: {str(e)}")

def extract_audio_from_video(video_path: str, output_filename: str = "temp_audio") -> str:
    out_path = f"{output_filename}.wav"
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    command = [ffmpeg_exe, "-y", "-i", str(video_path), "-vn", "-ac", "1", "-ar", "16000", "-acodec", "pcm_s16le", out_path]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0: raise Exception(f"Error extrayendo audio: {result.stderr.strip()}")
    return out_path

def get_video_duration_seconds(video_path: str) -> float:
    try:
        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
        total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0.0
        cap.release()
        return (total_frames / fps) if fps else 0.0
    except Exception: return 0.0

def sample_video_frames(video_path: str, max_frames: int = 6, max_seconds: int = 30):
    capture = cv2.VideoCapture(video_path)
    fps = capture.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    duration_seconds = total_frames / fps if fps else 0
    usable_seconds = min(max_seconds, duration_seconds) if duration_seconds else max_seconds
    frames_to_sample = max(1, min(max_frames, int(usable_seconds)))
    timestamps = [0.0] if frames_to_sample == 1 else [round((usable_seconds * idx) / (frames_to_sample - 1), 2) for idx in range(frames_to_sample)]
    sampled_frames = []
    for timestamp in timestamps:
        capture.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)
        success, frame = capture.read()
        if success and frame is not None:
            sampled_frames.append({"timestamp": timestamp, "image": Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))})
    capture.release()
    return sampled_frames, duration_seconds

def analyze_nonverbal_with_gemini(video_path: str) -> dict:
    try:
        sampled_frames, duration_seconds = sample_video_frames(video_path)
        if not sampled_frames: return {"available": False, "reason": "No se pudieron extraer frames"}
        frame_notes = "\n".join([f"- Frame {idx + 1}: segundo {frame['timestamp']}" for idx, frame in enumerate(sampled_frames)])
        prompt = f"""Eres analista de lenguaje no verbal. Evalúa: postura, contacto visual, expresión facial, uso de manos, confianza.
        Devuelve JSON con: puntaje_global(1-100), fortalezas[], debilidades[], recomendacion, postura, contacto_visual, uso_manos, expresion_facial, nivel_confianza.
        Duración: {round(duration_seconds, 2)}s\nFrames: {frame_notes}"""
        response = gemini_client.models.generate_content(model="gemini-2.5-flash", contents=[prompt, *[frame["image"] for frame in sampled_frames]])
        texto_limpio = response.text.replace("```json", "").replace("```", "").strip()
        return {"available": True, "frames_sampled": len(sampled_frames), "duration_seconds": round(duration_seconds, 2), "analysis": texto_limpio}
    except Exception as e: return {"available": False, "reason": str(e)}

def _run_transcription_step(session: Dict[str, Any]) -> None:
    if session["steps"]["transcription"]: return
    video_metadata = session["video_metadata"]
    with open(session["audio_path"], "rb") as file:
        transcription = groq_client.audio.transcriptions.create(
            file=(session["audio_path"], file.read()), model="whisper-large-v3",
            prompt=f"Pitch sobre {video_metadata.get('title', 'tecnología')}. Muletillas como eh, mmm, ah, o sea.",
            temperature=0, response_format="verbose_json", language="es"
        )
    session["transcription"] = getattr(transcription, "text", "")
    segmentos = getattr(transcription, "segments", []) or []
    words = getattr(transcription, "words", []) or []
    segmentos_detallados = [{"indice": i+1, "inicio": round(s.get("start",0),2), "fin": round(s.get("end",0),2), "duracion_segundos": round(s.get("end",0)-s.get("start",0),2), "texto": s.get("text","").strip(), "muletillas_detectadas": []} for i, s in enumerate(segmentos)]
    session["transcription_segments"] = segmentos_detallados
    session["transcription_words"] = [{"palabra": p.get("word","").strip(), "inicio": round(p.get("start",0),2), "fin": round(p.get("end",0),2)} for p in words]
    session["steps"]["transcription"] = True

def _run_verbal_metrics_step(session: Dict[str, Any]) -> None:
    if session["steps"]["verbal_metrics"]: return
    pitch_text = session["transcription"]
    segmentos = session.get("transcription_segments", []) or []
    duracion = segmentos[-1]["fin"] if segmentos else 0
    wpm = round((len(pitch_text.split()) / duracion) * 60) if duracion > 0 else 0
    silencios = [{"inicio": segmentos[i]["fin"], "duracion_segundos": round(segmentos[i+1]["inicio"]-segmentos[i]["fin"], 2)} for i in range(len(segmentos)-1) if (segmentos[i+1]["inicio"]-segmentos[i]["fin"]) > 2.0]
    muletillas = [" eh ", " este ", " mmm ", " o sea "]
    for s in segmentos: s["muletillas_detectadas"] = [m.strip() for m in muletillas if m.strip() in s.get("texto","").lower()]
    session["verbal_metrics"] = {"palabras_por_minuto": wpm, "nivel_velocidad": "Óptimo" if 130<=wpm<=160 else "Muy rápido" if wpm>160 else "Muy lento", "cantidad_muletillas": sum(pitch_text.lower().count(m) for m in muletillas), "silencios_largos": silencios}
    session["steps"]["verbal_metrics"] = True

def _run_content_step(session: Dict[str, Any]) -> None:
    if session["steps"]["content"]: return
    rubric_id_solicitada = session.get("rubric_id")
    
    # --- RAG RETRIEVAL: BÚSQUEDA VECTORIAL EN NEON ---
    print(f"Buscando bases de '{rubric_id_solicitada}' en BD Vectorial...")
    db_session = next(get_db())
    try:
        vector_pitch = get_embedding(session['transcription'])
        chunks_relevantes = db_session.query(RubricaChunk).filter(RubricaChunk.rubric_id == rubric_id_solicitada).order_by(RubricaChunk.embedding.cosine_distance(vector_pitch)).limit(5).all()
        contexto_rag = "\n\n".join([chunk.texto for chunk in chunks_relevantes]) if chunks_relevantes else "Evalúa la innovación, modelo de negocios, mercado y equipo."
    except Exception as e:
        print(f"Error en RAG Retrieval: {e}")
        contexto_rag = "Evalúa la innovación, modelo de negocios, mercado y equipo."
    finally:
        db_session.close()

    prompt = f"""Eres juez estricto. Basándote EXCLUSIVAMENTE en fragmentos de las bases oficiales: 
    <BASES> {contexto_rag} </BASES>
    Evalúa este pitch en JSON con: puntaje_global(1-100), puntos_fuertes(2), puntos_debiles(2), recomendacion. Pitch: "{session['transcription']}" """
    
    import time
    for intento in range(3):
        try:
            resp = gemini_client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
            session["content_evaluation"] = json.loads(resp.text.replace("```json", "").replace("```", "").strip())
            session["steps"]["content"] = True
            return
        except Exception as e:
            if "429" in str(e) and intento < 2: time.sleep(30)
            else: session["content_evaluation"] = {"error": str(e)}; session["steps"]["content"] = True; return

def _run_nonverbal_step(session: Dict[str, Any]) -> None:
    if session["steps"]["nonverbal"]: return
    session["nonverbal_evaluation"] = analyze_nonverbal_with_gemini(session["raw_video_path"])
    session["steps"]["nonverbal"] = True

def _run_all_steps_bg(analysis_id: str):
    session = ANALYSIS_SESSIONS.get(analysis_id)
    if not session: return
    try:
        _run_transcription_step(session)
        _run_verbal_metrics_step(session)
        _run_content_step(session)
        _run_nonverbal_step(session)
        _update_analysis_steps(analysis_id, session["steps"])
    except Exception as e: print(f"Error procesando pasos bg: {e}")

@app.post("/api/v1/analysis/upload")
async def start_analysis_upload(background_tasks: BackgroundTasks, file: UploadFile = File(...), rubricId: str = Form(None)):
    analysis_id = str(uuid.uuid4())
    raw_video_path = str(BASE_DIR / f"temp_video_{analysis_id}{Path(file.filename).suffix or '.mp4'}")
    try:
        with open(raw_video_path, "wb") as out_f: out_f.write(await file.read())
        raw_audio_path = extract_audio_from_video(raw_video_path, output_filename=str(BASE_DIR / f"temp_audio_{analysis_id}"))
        audio_path = normalize_audio_for_whisper(raw_audio_path)
        video_metadata = {"title": file.filename, "description": "Local", "channel": "local", "duration_seconds": round(get_video_duration_seconds(raw_video_path), 2), "webpage_url": f"local://{file.filename}"}
        session = {"analysis_id": analysis_id, "youtube_url": f"local://{file.filename}", "created_at": datetime.utcnow().isoformat(), "raw_audio_path": raw_audio_path, "audio_path": audio_path, "raw_video_path": raw_video_path, "video_metadata": video_metadata, "transcription": None, "transcription_segments": [], "transcription_words": [], "verbal_metrics": None, "content_evaluation": None, "nonverbal_evaluation": None, "steps": {"prepared": True, "transcription": False, "verbal_metrics": False, "content": False, "nonverbal": False}, "rubric_id": rubricId}
        ANALYSIS_SESSIONS[analysis_id] = session
        _save_analysis_record(analysis_id, video_metadata, f"local://{file.filename}", rubricId)
        background_tasks.add_task(_run_all_steps_bg, analysis_id)
        return {"status": "success", "analysis_id": analysis_id, "message": "Análisis en proceso..."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/analysis/start")
async def start_analysis(request: AnalysisStartRequest):
    analysis_id = str(uuid.uuid4())
    raw_video_path = download_video_from_youtube(request.youtube_url, output_filename=f"temp_video_{analysis_id}")
    raw_audio_path = download_audio_from_youtube(request.youtube_url, output_filename=f"temp_audio_{analysis_id}")
    audio_path = normalize_audio_for_whisper(raw_audio_path)
    video_metadata = fetch_video_metadata(request.youtube_url)
    session = {"analysis_id": analysis_id, "youtube_url": request.youtube_url, "created_at": datetime.utcnow().isoformat(), "raw_audio_path": raw_audio_path, "audio_path": audio_path, "raw_video_path": raw_video_path, "video_metadata": video_metadata, "transcription": None, "transcription_segments": [], "transcription_words": [], "verbal_metrics": None, "content_evaluation": None, "nonverbal_evaluation": None, "steps": {"prepared": True, "transcription": False, "verbal_metrics": False, "content": False, "nonverbal": False}, "rubric_id": request.rubric_id}
    ANALYSIS_SESSIONS[analysis_id] = session
    _save_analysis_record(analysis_id, video_metadata, request.youtube_url, request.rubric_id)
    return {"status": "success", "analysis_id": analysis_id}

@app.get("/api/v1/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    s = ANALYSIS_SESSIONS.get(analysis_id)
    if not s: 
        s = ANALYSIS_HISTORY.get(analysis_id)
        if not s: raise HTTPException(status_code=404, detail="No encontrado")
        return {"status": "success", "steps": s["steps"], "data": {"video_metadata": {"title": s.get("title")}, "content_evaluation": {"puntaje_global": s.get("score")}}}
    return {"status": "success", "steps": s["steps"], "data": {"video_metadata": s["video_metadata"], "transcription": s["transcription"], "transcription_segments": s["transcription_segments"], "verbal_metrics": s["verbal_metrics"], "content_evaluation": s["content_evaluation"], "nonverbal_evaluation": s["nonverbal_evaluation"]}}

@app.delete("/api/v1/analysis/{analysis_id}")
async def close_analysis(analysis_id: str):
    s = ANALYSIS_SESSIONS.get(analysis_id)
    if s:
        for k in ["audio_path", "raw_audio_path", "raw_video_path"]:
            if s.get(k) and os.path.exists(s[k]): os.remove(s[k])
    return {"status": "success"}

@app.post("/api/v1/analysis/{analysis_id}/transcription")
async def run_transcription(analysis_id: str):
    session = ANALYSIS_SESSIONS.get(analysis_id)
    _run_transcription_step(session)
    _update_analysis_steps(analysis_id, session["steps"])
    return {"status": "success"}

@app.post("/api/v1/analysis/{analysis_id}/verbal-metrics")
async def run_verbal_metrics(analysis_id: str):
    session = ANALYSIS_SESSIONS.get(analysis_id)
    _run_verbal_metrics_step(session)
    _update_analysis_steps(analysis_id, session["steps"])
    return {"status": "success"}

@app.post("/api/v1/analysis/{analysis_id}/content")
async def run_content(analysis_id: str):
    session = ANALYSIS_SESSIONS.get(analysis_id)
    _run_content_step(session)
    _update_analysis_steps(analysis_id, session["steps"])
    return {"status": "success"}

@app.post("/api/v1/analysis/{analysis_id}/nonverbal")
async def run_nonverbal(analysis_id: str):
    session = ANALYSIS_SESSIONS.get(analysis_id)
    _run_nonverbal_step(session)
    _update_analysis_steps(analysis_id, session["steps"])
    return {"status": "success"}