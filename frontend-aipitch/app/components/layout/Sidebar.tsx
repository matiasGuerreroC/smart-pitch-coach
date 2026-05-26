import Link from 'next/link';

export function Sidebar() {
  return (
    <div className="flex flex-col h-full p-4">
      <div className="text-xl font-bold text-blue-600 px-2 py-4 mb-6">AIPitch</div>
      <nav className="flex-1 space-y-1">
        <Link href="/" className="block px-4 py-2.5 rounded-xl hover:bg-slate-100 font-medium text-slate-700">Inicio</Link>
        <Link href="/recorder" className="block px-4 py-2.5 rounded-xl hover:bg-slate-100 font-medium text-slate-700">Nuevo Análisis</Link>
        <Link href="/history" className="block px-4 py-2.5 rounded-xl hover:bg-slate-100 font-medium text-slate-700">Historial</Link>
        <Link href="/rubrics" className="block px-4 py-2.5 rounded-xl hover:bg-slate-100 font-medium text-slate-700">Rúbricas</Link>
      </nav>
      <div className="border-t border-slate-100 pt-4">
        <Link href="/login" className="block px-4 py-2 text-sm text-slate-500 hover:text-slate-900">Cerrar sesión</Link>
      </div>
    </div>
  );
}