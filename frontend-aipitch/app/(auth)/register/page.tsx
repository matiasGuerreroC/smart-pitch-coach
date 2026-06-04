import Link from 'next/link';
import { Info } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AIPitch
          </span>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Smart Pitch Coach</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Crear Cuenta</h1>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Registro de nuevos usuarios</p>
          </div>

          <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl mb-6">
            <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              El registro de nuevos usuarios aún no está disponible. Por ahora el acceso es solo para evaluadores autorizados.
            </p>
          </div>

          <Link
            href="/login"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition text-sm"
          >
            Ir al Login
          </Link>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
