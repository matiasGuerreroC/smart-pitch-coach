import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Crear Cuenta</h1>
          <p className="text-slate-400 text-sm mt-1">Comienza a pulir tus habilidades de oratoria</p>
        </div>
        <form className="space-y-4" action="/login">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nombre Completo</label>
            <input type="text" required placeholder="Juan Pérez" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Correo Electrónico</label>
            <input type="email" required placeholder="tu@correo.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
            <input type="password" required placeholder="Mínimo 8 caracteres" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition text-sm">
            Registrarme
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          ¿Ya tienes cuenta? <Link href="/login" className="text-blue-600 font-medium hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}