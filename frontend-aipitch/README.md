# Frontend AIPitch (Next.js)

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+ (o pnpm / yarn)

## Instalacion

Desde la carpeta del frontend:

```bash
cd frontend-aipitch
npm install
```

## Variables de entorno (opcional)

Si tu backend no corre en `http://localhost:8000`, crea un archivo `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Notas

- El frontend consume el backend en `/api/v1`.
- Si ves errores de CORS, revisa la configuracion en el backend.
