# smart-pitch-coach

Proyecto para analizar y dar feedback a pitches en video usando modelos de IA.

Estructura principal:
- [backend](backend/): API en FastAPI que procesa videos/pitches.
- [frontend-aipitch](frontend-aipitch/): frontend Next.js (interfaz actual).

Requisitos rápidos:
- Python 3.10+
- Node.js 18+ (para el frontend Next.js)
- `ffmpeg` en PATH (opcional si usas `imageio-ffmpeg` del backend)

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

Quick start (frontend Next.js):

```bash
cd frontend-aipitch
npm install
npm run dev
```

Abre `http://localhost:3000`.

Si quieres ejecutar el frontend legacy (Ionic/Angular), revisa [frontendold/README.md](frontendold/README.md).
Para el frontend actual, revisa [frontend-aipitch/README.md](frontend-aipitch/README.md).