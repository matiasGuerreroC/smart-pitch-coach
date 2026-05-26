export function ConnectionWarning() {
  return (
    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-sm shadow-sm animate-fade-in">
      <span className="text-lg">⚠️</span>
      <div>
        <strong className="font-semibold">Modo desconectado:</strong> No pudimos conectar con el servidor de FastAPI. Mostrando datos de respaldo locales.
      </div>
    </div>
  );
}