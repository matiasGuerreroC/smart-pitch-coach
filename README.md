# smart-pitch-coach

Proyecto para analizar y dar feedback a pitches en video usando modelos de IA.

Estructura principal:
- [backend](backend/): API en FastAPI que procesa videos/pitches.
- [frontend](frontend/): cliente Ionic/Angular (interfaz de usuario).

Requisitos rápidos:
- Python 3.10+
- `ffmpeg` disponible en PATH (necesario para extraer/normalizar audio)

Quick start (backend):

1. Crear y activar un entorno virtual:

```bash
python -m venv venv
source venv/Scripts/activate  # Windows (Git Bash / WSL puede variar)
```

2. Instalar dependencias:

```bash
pip install -r backend/requirements.txt
```

3. Crear un archivo `.env` en `backend/` con las claves necesarias (ver [backend/README.md](backend/README.md)).

4. Ejecutar la API:

```bash
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

La API de backend tendrá una página de debug en `http://127.0.0.1:8000/debug`.

Si quieres ejecutar el frontend, revisa [frontend/README.md](frontend/README.md) para instrucciones.