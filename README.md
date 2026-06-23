# AIPitch - Asistente Inteligente para la Evaluación de Pitch

AIPitch es una **plataforma web y móvil** impulsada por Inteligencia Artificial Multimodal y arquitectura de microservicios asíncronos. Su objetivo es actuar como un mentor virtual que evalúa presentaciones (pitches) de emprendimiento en tres dimensiones críticas: **Verbal, No Verbal y Contenido Semántico**.

Proyecto desarrollado por el **Grupo 10** para el Taller de Ingeniería de Software (PUCV).

---

## Características Principales

- **Análisis Verbal (ASR):** Transcripción ultrarrápida, cálculo de velocidad de habla (WPM), detección de pausas largas y conteo de muletillas.
- **Evaluación de Contenido (RAG):** Motor de Recuperación Aumentada (Retrieval-Augmented Generation) que cruza matemáticamente el discurso del usuario con rúbricas oficiales (ej. ANID VIU, Corfo) almacenadas en una base de datos vectorial.
- **Análisis No Verbal (Visión Computacional):** Extracción de fotogramas mediante OpenCV y evaluación multimodal (postura, contacto visual, gestos) a través de Gemini 1.5 Flash.
- **Dashboard Evolutivo:** Generación de métricas de progreso, cálculo de mejora entre intentos y renderizado de resultados en tiempo real.
- **Procesamiento Asíncrono:** Gestión de cargas multimedia pesadas en segundo plano mediante `BackgroundTasks`, garantizando una experiencia de usuario fluida sin bloqueos.

---

## Stack Tecnológico

**Frontend:**
- [Next.js](https://nextjs.org/) (React App Router)
- Tailwind CSS

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) (Python)
- FFmpeg & yt-dlp (Procesamiento multimedia y extracción de audio)
- OpenCV (Muestreo de fotogramas clave)

**Inteligencia Artificial:**
- **Groq API** (`whisper-large-v3`): Reconocimiento automático del habla (ASR).
- **Google AI Studio** (`gemini-2.5-flash` y `text-embedding-004`): Análisis cognitivo, multimodal y generación de embeddings.

**Base de Datos:**
- **Neon.tech** (PostgreSQL Serverless)
- Extensión **pgvector** (Búsqueda de similitud vectorial para RAG)
- SQLAlchemy (ORM)

---

## Requisitos Previos

Asegúrate de tener instalado en tu sistema:
- **Python 3.10+**
- **Node.js 18+** (Para el cliente Next.js)
- **FFmpeg** instalado y agregado al PATH del sistema (para la manipulación de audio/video local).

---

## Configuración del Proyecto (Entorno Local)

El proyecto utiliza una arquitectura *Monorepo*. Sigue estos pasos para levantar el entorno de desarrollo:

### 1. Variables de Entorno (.env)
En la carpeta `/backend`, crea un archivo llamado `.env` e incluye las siguientes claves (solicitar credenciales al equipo en caso de no tenerlas):

```env
GROQ_API_KEY=tu_clave_de_groq_aqui
GEMINI_API_KEY=tu_clave_de_google_aqui
DATABASE_URL=postgresql://usuario:password@host.neon.tech/neondb?sslmode=require
```

### 2. Levantar el Backend (FastAPI)

Abre una terminal y ejecuta los siguientes comandos:

```bash
cd backend

# Crear y activar entorno virtual
python -m venv venv
# En Windows: .\venv\Scripts\activate
# En Mac/Linux: source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar el servidor
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
> La API estará disponible en `http://127.0.0.1:8000`. 
> Se incluye un cliente de debug nativo en `http://127.0.0.1:8000/debug`.

### 3. Levantar el Frontend (Next.js)

Abre una segunda terminal y ejecuta:

```bash
cd frontend-aipitch

# Instalar dependencias de Node
npm install

# Iniciar el servidor de desarrollo
npm run dev
```
> La interfaz de usuario estará disponible en `http://localhost:3000`.

---

## Despliegue (Producción)

El sistema se encuentra desplegado y habilitado para su acceso público en la nube:
- **Aplicación Web/Móvil:** [https://aipitch.vercel.app/](https://aipitch.vercel.app/)
- **Infraestructura Cloud:** Vercel (Frontend) y Render (Backend).

**Credenciales de acceso para evaluación:**
- **Usuario:** `evaluador@aipitch.cl`
- **Contraseña:** `Prueba2026!`

---
