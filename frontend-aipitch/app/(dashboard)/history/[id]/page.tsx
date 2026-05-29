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

  const evolution = pitch?.evolutionMetrics;

  const formatDelta = (value: number, unit: string) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value} ${unit}`;
  };

  const tryParse = (maybeJson?: string | null) => {
    if (!maybeJson) return null;
    try {
      return JSON.parse(maybeJson);
    } catch (e) {
      return null;
    }
  };

  const renderContentFeedback = (raw?: string | null) => {
    const parsed = tryParse(raw as any) as any;
    if (!parsed) return <p className="text-slate-600 leading-relaxed whitespace-pre-line">{raw || 'Sin feedback disponible.'}</p>;

    const score = parsed.puntaje_global ?? parsed.puntaje ?? parsed.score ?? null;
    const strengths = parsed.puntos_fuertes || parsed.fortalezas || parsed.strengths || [];
    const weaknesses = parsed.puntos_debiles || parsed.debilidades || parsed.weaknesses || [];
    const recommendation = parsed.recomendacion || parsed.recommendation || parsed.recomendaciones || '';

    return (
      <div className="space-y-4">
        {score !== null && (
          <div className="flex items-center gap-4">
            <div className="text-3xl font-extrabold text-blue-600">{score}</div>
            <div className="text-sm text-slate-500 uppercase font-medium">Puntaje Global</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Puntos Fuertes</h4>
            <ul className="list-disc list-inside text-slate-600">
              {(strengths.length ? strengths : ['No hay puntos fuertes detectados']).map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Puntos Débiles</h4>
            <ul className="list-disc list-inside text-slate-600">
              {(weaknesses.length ? weaknesses : ['No hay puntos débiles detectados']).map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {recommendation && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Recomendación</h4>
            <p className="text-slate-600">{recommendation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderNonverbalFeedback = (raw?: string | null) => {
    const parsed = tryParse(raw as any) as any;
    if (!parsed) return <p className="text-slate-600 leading-relaxed whitespace-pre-line">{raw || 'Sin análisis no verbal.'}</p>;

    const strengths = parsed.fortalezas || parsed.strengths || [];
    const weaknesses = parsed.debilidades || parsed.weaknesses || [];
    const recommendation = parsed.recomendacion || parsed.recommendation || '';
    const posture = parsed.postura || parsed.posture || '';
    const eyeContact = parsed.contacto_visual || parsed.contactoVisual || parsed.eye_contact || '';
    const hands = parsed.uso_manos || parsed.hand_use || '';
    const expression = parsed.expresion_facial || parsed.expression || '';
    const confidence = parsed.nivel_confianza || parsed.nivel || parsed.confidence || '';

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h5 className="text-xs text-slate-400 uppercase">Postura</h5>
            <p className="text-slate-600">{posture || '—'}</p>
          </div>
          <div>
            <h5 className="text-xs text-slate-400 uppercase">Contacto Visual</h5>
            <p className="text-slate-600">{eyeContact || '—'}</p>
          </div>
          <div>
            <h5 className="text-xs text-slate-400 uppercase">Uso de Manos</h5>
            <p className="text-slate-600">{hands || '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-xs text-slate-400 uppercase">Expresión Facial</h5>
            <p className="text-slate-600">{expression || '—'}</p>
          </div>
          <div>
            <h5 className="text-xs text-slate-400 uppercase">Nivel de Confianza</h5>
            <p className="text-slate-600">{confidence || '—'}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Fortalezas</h4>
          <ul className="list-disc list-inside text-slate-600">
            {(strengths.length ? strengths : ['No hay fortalezas detectadas']).map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Debilidades</h4>
          <ul className="list-disc list-inside text-slate-600">
            {(weaknesses.length ? weaknesses : ['No hay debilidades detectadas']).map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        {recommendation && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Recomendación</h4>
            <p className="text-slate-600">{recommendation}</p>
          </div>
        )}
      </div>
    );
  };

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-4 border-dashed border-slate-200 bg-slate-50/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Métricas evolutivas</h2>
              <p className="text-sm text-slate-500 mt-1">
                Comparación contra el pitch inmediatamente anterior.
              </p>
            </div>
            {evolution?.previousId ? (
              <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">
                Anterior: {evolution.previousId}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Δ Puntaje Global</div>
              <div className={`text-2xl font-bold mt-2 ${((evolution?.deltaScore ?? 0) >= 0) ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatDelta(evolution?.deltaScore ?? 0, 'pts')}
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Δ Palabras por minuto</div>
              <div className={`text-2xl font-bold mt-2 ${((evolution?.deltaWpm ?? 0) >= 0) ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatDelta(evolution?.deltaWpm ?? 0, 'PPM')}
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Δ Muletillas</div>
              <div className={`text-2xl font-bold mt-2 ${((evolution?.deltaFillers ?? 0) <= 0) ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatDelta(evolution?.deltaFillers ?? 0, 'menciones')}
              </div>
            </div>
          </div>

          {!evolution?.previousId && (
            <p className="text-sm text-slate-500 mt-4">
              No hay un análisis anterior para comparar, por lo que estas métricas aparecen en cero.
            </p>
          )}
        </Card>
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
            {renderContentFeedback(pitch.contentFeedback)}
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
            {renderNonverbalFeedback(pitch.nonVerbalFeedback)}
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