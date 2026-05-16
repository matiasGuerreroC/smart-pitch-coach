# Backend - FastAPI

Este servicio implementa la API para analizar pitches en video usando:
- Transcripción/ASR: Groq (Whisper-large-v3)
- Evaluación de contenido y análisis no verbal: Google Gemini (Generative)
- Descarga de YouTube: `yt-dlp`

Requisitos:
- Python 3.10+
- `ffmpeg` en PATH
- Claves de API para Groq y Gemini

Instalación rápida:

```bash
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
```

Variables de entorno
Coloca un archivo `.env` en la carpeta `backend/` con al menos:

- `GROQ_API_KEY`=tu_clave_groq
- `GEMINI_API_KEY`=tu_clave_gemini

Uso (desarrollo)

```bash
# desde la carpeta backend/
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Endpoints principales
- `GET /` : Información básica y lista de endpoints.
- `GET /debug` : Interfaz de prueba (sirve `debug/index.html`).
- `POST /api/v1/analysis/start` : Crea una sesión de análisis a partir de una URL de YouTube.
- `POST /api/v1/analysis/{analysis_id}/transcription` : Ejecuta transcripción (Whisper/Groq).
- `POST /api/v1/analysis/{analysis_id}/verbal-metrics` : Calcula métricas verbales (WPM, muletillas, pausas).
- `POST /api/v1/analysis/{analysis_id}/content` : Evalúa contenido con Gemini.
- `POST /api/v1/analysis/{analysis_id}/nonverbal` : Ejecuta análisis no verbal (frames + Gemini).
- `POST /api/v1/analyze-pitch` : Flujo todo-en-uno que descarga el video y devuelve análisis (ver `main.py`).
- `POST /api/v1/analysis/upload` : Subir un video local para crear sesión.

Ejemplos rápidos (curl)

Iniciar sesión de análisis por URL:

```bash
curl -s -X POST "http://127.0.0.1:8000/api/v1/analysis/start" \
	-H "Content-Type: application/json" \
	-d '{"youtube_url":"https://youtu.be/VIDEO_ID"}'
```

Ejecutar análisis completo (todo-en-uno):

```bash
curl -s -X POST "http://127.0.0.1:8000/api/v1/analyze-pitch" \
	-H "Content-Type: application/json" \
	-d '{"youtube_url":"https://youtu.be/VIDEO_ID"}'
```

Notas y dependencias del sistema
- `ffmpeg` es requerido por las funciones de extracción/normalización de audio.
- El servicio utiliza `yt-dlp` para descargar videos de YouTube.
- Asegúrate de tener las claves válidas en `.env` antes de ejecutar endpoints que llamen a Groq o Gemini.

Dónde mirar el código
- La lógica principal de endpoints y pasos de análisis está en `main.py`.

Si quieres, puedo añadir ejemplos de `.env`, scripts de Docker o tareas de GitHub Actions para desplegar la API.