'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card } from '../../components/ui/Card';
import { ConnectionWarning } from '../../components/ui/ConnectionWarning';
import { api } from '../../lib/api';
import { Analysis } from '../../types';

export default function HistoryPage() {
  const [data, setData] = useState<Analysis[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getHistory()
      .then((res) => {
        setData(res);
        setIsLoading(false);
      })
      .catch(() => {
        setIsFallback(true);
        setIsLoading(false);
      });
  }, []);

  // Lógica para agrupar los análisis por nombre de rúbrica
  const groupedAnalyses = data.reduce((acc, curr) => {
    const group = curr.rubricName || 'Análisis Generales (Sin rúbrica)';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(curr);
    return acc;
  }, {} as Record<string, Analysis[]>);

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500">Cargando historial...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {isFallback && <ConnectionWarning />}
      
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Historial de Pitches</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Tus intentos están agrupados por el contexto o rúbrica de evaluación.
        </p>
      </div>

      {Object.keys(groupedAnalyses).length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-500">Aún no tienes análisis registrados.</p>
        </Card>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedAnalyses).map(([groupName, analyses]) => (
            <section key={groupName} className="space-y-4">
              {/* Cabecera del Grupo */}
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
                  📊
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {groupName}
                </h2>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs px-2.5 py-1 rounded-full font-medium ml-auto">
                  {analyses.length} intentos
                </span>
              </div>

              {/* Gráfico de Tendencias */}
              {analyses.length >= 2 ? (() => {
                const chartData = [...analyses]
                  .filter(a => a.status === 'completed')
                  .reverse()
                  .map((a, i) => ({ name: `#${i + 1}`, score: a.score, title: a.title }));
                const improvement = chartData.length >= 2
                  ? Math.round(((chartData[chartData.length - 1].score - chartData[0].score) / Math.max(chartData[0].score, 1)) * 100)
                  : 0;
                return (
                  <Card className="border-blue-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Evolución del Puntaje</h3>
                      {improvement !== 0 && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${improvement > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                          {improvement > 0 ? '+' : ''}{improvement}% vs primer intento
                        </span>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} width={28} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                          formatter={(value) => [`${value} pts`, 'Puntaje']}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.title ?? label}
                        />
                        <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                );
              })() : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-400 dark:text-slate-500">
                  <span>📈</span>
                  <span>Se requiere al menos un ensayo adicional para generar tu gráfico de tendencias.</span>
                </div>
              )}

              {/* Lista de Tarjetas del Grupo */}
              <div className="grid grid-cols-1 gap-4">
                {analyses.map((item) => (
                  <Link key={item.id} href={`/history/${item.id}`}>
                    <Card className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group">
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                          Evaluado el {item.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 justify-between sm:justify-end">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {item.status === 'completed' ? 'Completado' : 'Procesando'}
                        </span>
                        <div className="text-right w-20">
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{item.score}</span>
                          <span className="text-slate-400 dark:text-slate-500 text-sm">/100</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}