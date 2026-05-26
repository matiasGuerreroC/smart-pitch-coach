// app/(dashboard)/page.tsx
import { Card } from '../components/ui/Card';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white rounded-3xl p-8 md:p-12 shadow-md relative overflow-hidden">
        {/* Decoración de fondo sutil */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Bienvenid@ a AIPitch</h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mb-8">
            Mejora tus habilidades de oratoria analizando tu comunicación verbal, contenido y lenguaje corporal con Inteligencia Artificial.
          </p>
          <Link 
            href="/recorder" 
            className="inline-flex items-center bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <span className="mr-2">🎙️</span> Iniciar Nuevo Análisis
          </Link>
        </div>
      </section>

      {/* Bento Grid de Accesos Rápidos */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta de Historial (Ocupa 2 columnas en desktop) */}
        <Link href="/history" className="md:col-span-2 group">
          <Card className="h-full bg-gradient-to-br from-white to-slate-50 border-slate-200 group-hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Últimos Análisis</h2>
                <p className="text-slate-500 text-sm mt-1">Revisa tu progreso y el feedback de tus últimas prácticas.</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                📋
              </div>
            </div>
            
            {/* Mock de un item reciente para dar vida al home */}
            <div className="space-y-3">
               <div className="p-4 bg-white rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                  <div>
                    <div className="font-semibold text-slate-700">Demo Day Pitch Seed</div>
                    <div className="text-xs text-slate-400">Hace 2 días</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-blue-600 font-extrabold text-lg">85 / 100</span>
                  </div>
               </div>
            </div>
          </Card>
        </Link>
        
        {/* Tarjeta de Rúbricas */}
        <Link href="/rubrics" className="group">
          <Card className="h-full flex flex-col justify-between border-slate-200 group-hover:border-blue-300 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-slate-800">Rúbricas</h2>
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                  📊
                </div>
              </div>
              <p className="text-slate-500 text-sm">Configura los criterios de evaluación que la IA usará para darte feedback.</p>
            </div>
            <div className="mt-6 text-blue-600 font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform">
              Gestionar criterios <span className="ml-2">&rarr;</span>
            </div>
          </Card>
        </Link>
      </section>
    </div>
  );
}