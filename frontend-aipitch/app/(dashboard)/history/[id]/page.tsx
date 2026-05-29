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

  const progressFlow: Array<{ key: 'transcription' | 'verbal_metrics' | 'content' | 'nonverbal'; label: string }> = [
    { key: 'transcription', label: 'Transcribiendo audio (Whisper)' },
    { key: 'verbal_metrics', label: 'Calculando métricas verbales' },
    { key: 'content', label: 'Evaluando contenido con LLM' },
    { key: 'nonverbal', label: 'Analizando comunicación no verbal' },
  ];

  const evolution = pitch?.evolutionMetrics;

  const formatDelta = (value: number, unit: string) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value} ${unit}`;
  };

  const tryParse = (maybeJson?: string | null) => {
    if (!maybeJson) return null;
    try {
      return JSON.parse(maybeJson);
    } catch {
      return null;
    }
  };

  const getStringArray = (value: unknown, fallback: string): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item : String(item)))
        .filter(Boolean);
    }
    return [fallback];
  };

  const getStringValue = (value: unknown, fallback = ''): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return fallback;
    return String(value);
  };

  const renderContentFeedback = (raw?: string | null) => {
    const parsed = tryParse(raw) as Record<string, unknown> | null;
    if (!parsed) return <p className="text-slate-600 leading-relaxed whitespace-pre-line">{raw || 'Sin feedback disponible.'}</p>;

    const score = parsed.puntaje_global ?? parsed.puntaje ?? parsed.score ?? null;
    const strengths = getStringArray(parsed.puntos_fuertes ?? parsed.fortalezas ?? parsed.strengths, 'No hay puntos fuertes detectados');
    const weaknesses = getStringArray(parsed.puntos_debiles ?? parsed.debilidades ?? parsed.weaknesses, 'No hay puntos débiles detectados');
    const recommendation = getStringValue(parsed.recomendacion ?? parsed.recommendation ?? parsed.recomendaciones, '');

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
              {strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Puntos Débiles</h4>
            <ul className="list-disc list-inside text-slate-600">
              {weaknesses.map((s, i) => (
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
    const parsed = tryParse(raw) as Record<string, unknown> | null;
    if (!parsed) return <p className="text-slate-600 leading-relaxed whitespace-pre-line">{raw || 'Sin análisis no verbal.'}</p>;

    const strengths = getStringArray(parsed.fortalezas ?? parsed.strengths, 'No hay fortalezas detectadas');
    const weaknesses = getStringArray(parsed.debilidades ?? parsed.weaknesses, 'No hay debilidades detectadas');
    const recommendation = getStringValue(parsed.recomendacion ?? parsed.recommendation, '');
    const posture = getStringValue(parsed.postura ?? parsed.posture, '');
    const eyeContact = getStringValue(parsed.contacto_visual ?? parsed.contactoVisual ?? parsed.eye_contact, '');
    const hands = getStringValue(parsed.uso_manos ?? parsed.hand_use, '');
    const expression = getStringValue(parsed.expresion_facial ?? parsed.expression, '');
    const confidence = getStringValue(parsed.nivel_confianza ?? parsed.nivel ?? parsed.confidence, '');

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
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Debilidades</h4>
          <ul className="list-disc list-inside text-slate-600">
            {weaknesses.map((s, i) => (
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

  const currentStepLabel = () => {
    if (!pitch?.progressSteps) return 'Preparando análisis';
    const next = progressFlow.find((step) => !pitch.progressSteps?.[step.key]);
    return next ? next.label : 'Análisis completado';
  };

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchWithPolling = async () => {
      try {
        const detail = await api.getAnalysisDetail(id as string);
        if (!isMounted) return;
        setPitch(detail);
        setIsFallback(false);

        if (detail.status === 'processing') {
          timer = setTimeout(fetchWithPolling, 2500);
        }
      } catch {
        if (!isMounted) return;
        setIsFallback(true);
        timer = setTimeout(fetchWithPolling, 4000);
      }
    };

    fetchWithPolling();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
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

      {pitch.status === 'processing' && (
        <Card className="border-blue-100 bg-blue-50/60">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h3 className="text-base font-bold text-blue-800">Análisis en progreso</h3>
              <p className="text-sm text-blue-700">{currentStepLabel()}</p>
            </div>
            <div className="text-2xl font-extrabold text-blue-600">{pitch.progressPercent ?? 0}%</div>
          </div>

          <div className="w-full h-2 rounded-full bg-blue-100 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${pitch.progressPercent ?? 0}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 text-sm">
            {progressFlow.map((step) => {
              const done = Boolean(pitch.progressSteps?.[step.key]);
              return (
                <div key={step.key} className={`rounded-lg px-3 py-2 border ${done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <span className="mr-2">{done ? '✔' : '…'}</span>
                  {step.label}
                </div>
              );
            })}
          </div>
        </Card>
      )}

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
              <div className="text-3xl font-bold text-slate-800 mt-2">{pitch.verbalMetrics?.fillerWordsCount ?? 0}</div>
            </Card>
            <Card className="text-center">
              <div className="text-xs font-semibold text-slate-400 uppercase">Velocidad de Habla</div>
              <div className="text-3xl font-bold text-slate-800 mt-2">{pitch.verbalMetrics?.wordsPerMinute ?? 0} <span className="text-sm font-normal text-slate-500">PPM</span></div>
            </Card>
            <Card className="text-center">
              <div className="text-xs font-semibold text-slate-400 uppercase">Energía del Tono</div>
              <div className="text-3xl font-bold text-emerald-600 mt-2">{pitch.verbalMetrics?.toneEnergy ?? 'Sin datos'}</div>
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