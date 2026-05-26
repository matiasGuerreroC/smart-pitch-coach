import Link from 'next/link';

export function BottomNav() {
  return (
    <nav className="flex justify-around items-center h-16 px-2">
      <Link href="/" className="flex flex-col items-center justify-center text-xs font-medium text-slate-600 hover:text-blue-600">
        <span>🏠</span><span>Inicio</span>
      </Link>
      <Link href="/recorder" className="flex flex-col items-center justify-center text-xs font-medium text-slate-600 hover:text-blue-600">
        <span>🎙️</span><span>Nuevo</span>
      </Link>
      <Link href="/history" className="flex flex-col items-center justify-center text-xs font-medium text-slate-600 hover:text-blue-600">
        <span>📋</span><span>Historial</span>
      </Link>
      <Link href="/rubrics" className="flex flex-col items-center justify-center text-xs font-medium text-slate-600 hover:text-blue-600">
        <span>📊</span><span>Rúbricas</span>
      </Link>
    </nav>
  );
}