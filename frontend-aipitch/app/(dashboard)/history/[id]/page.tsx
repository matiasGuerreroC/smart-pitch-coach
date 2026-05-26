'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { ConnectionWarning } from '../../../components/ui/ConnectionWarning';
import { api } from '../../../lib/api';
import { Analysis } from '../../../types';

type TabType = 'content' | 'verbal' | 'nonverbal' | 'transcription';

export default function PitchDetailPage() {
  const { id } = useParams();
  const [pitch, setPitch] = useState<Analysis | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (id) {
      api.getAnalysisDetail(id as string)
        .then(setPitch)
        .catch(() => setIsFallback(true));
    }
  }, [id]);

  if (!pitch) return <div className="text-center py-12 text-slate-500">Cargando análisis...</div>;

  return (
    <div className="space-y-6">
      {isFallback && <ConnectionWarning />}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{pitch.title}</h1>
          <p className="text-slate-400 text-sm mt-1">ID de análisis: {pitch.id} • {pitch.date}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-3 text-center self-stretch md:self-auto">
          <div className="text-3xl font-extrabold text-blue-600">{pitch.score}</div>
          <div className="text-xs font-medium text-blue-500 uppercase tracking-wider">Puntaje Global</div>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 no-scrollbar">
        {(['content', 'verbal', 'nonverbal', 'transcription'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'content' && '💡 Feedback de Contenido (LLM)'}
            {tab === 'verbal' && '📊 Métricas Verbales'}
            {tab === 'nonverbal' && '🎭 Comunicación No Verbal'}
            {tab === 'transcription' && '📝 Transcripción'}
          </button>
        ))}
      </div>

      {/* Tab Panels Content */}
      <div className="mt-4">
        {activeTab === 'content' && (
          <Card>
            <h3 className="text-lg font-bold text-slate-800 mb-3">Recomendaciones del Coach de IA</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {pitch.contentFeedback || 'El modelo determinó que la estructura argumentativa es sólida, pero se aconseja enfatizar con mayor claridad la propuesta de valor en los primeros 30 segundos del pitch para retener el interés.'}
            </p>
          </Card>
        )}

        {activeTab === 'verbal' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center">
              <div className="text-xs font-semibold text-slate-400 uppercase">Muletillas Detectadas</div>
              <div className="text-3xl font-bold text-slate-800 mt-2">{pitch.verbalMetrics?.fillerWordsCount || 8}</div>
            </Card>
            <Card className="text-center">
              <div className="text-xs font-semibold text-slate-400 uppercase">Velocidad de Habla</div>
              <div className="text-3xl font-bold text-slate-800 mt-2">{pitch.verbalMetrics?.wordsPerMinute || 135} <span className="text-sm font-normal text-slate-500">PPM</span></div>
            </Card>
            <Card className="text-center">
              <div className="text-xs font-semibold text-slate-400 uppercase">Energía del Tono</div>
              <div className="text-3xl font-bold text-emerald-600 mt-2">{pitch.verbalMetrics?.toneEnergy || 'Estable'}</div>
            </Card>
          </div>
        )}

        {activeTab === 'nonverbal' && (
          <Card>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Análisis de Contacto Visual y Postura</h3>
            <p className="text-slate-600">
              {pitch.nonVerbalFeedback || 'Buen encuadre de cámara. Se detecta un lenguaje corporal abierto, aunque se recomienda reducir los movimientos oscilatorios repetitivos.'}
            </p>
          </Card>
        )}

        {activeTab === 'transcription' && (
          <Card className="bg-slate-50 border-slate-200">
            <p className="text-slate-700 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {pitch.transcription || '"Hola a todos, hoy les quiero presentar nuestra solución para optimizar el entrenamiento de oratoria corporativa..."'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}