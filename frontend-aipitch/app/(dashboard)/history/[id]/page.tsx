'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { ConnectionWarning } from '../../../components/ui/ConnectionWarning';
import { api } from '../../../lib/api';
import { Analysis, TranscriptionSegment, Silence } from '../../../types';

type TabType = 'content' | 'verbal' | 'nonverbal' | 'transcription';

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&?/]+)/,
    /youtu\.be\/([^&?/]+)/,
    /youtube\.com\/embed\/([^&?/]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function PitchDetailPage() {
  const { id } = useParams();
  const [pitch, setPitch] = useState<Analysis | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [isFallback, setIsFallback] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    if (!parsed) return <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{raw || 'Sin feedback disponible.'}</p>;

    const score = parsed.puntaje_global ?? parsed.puntaje ?? parsed.score ?? null;
    const scoreDisplay = score !== null ? String(score) : null;
    const strengths = getStringArray(parsed.puntos_fuertes ?? parsed.fortalezas ?? parsed.strengths, 'No hay puntos fuertes detectados');
    const weaknesses = getStringArray(parsed.puntos_debiles ?? parsed.debilidades ?? parsed.weaknesses, 'No hay puntos débiles detectados');
    const recommendation = getStringValue(parsed.recomendacion ?? parsed.recommendation ?? parsed.recomendaciones, '');

    return (
      <div className="space-y-4">
        {scoreDisplay !== null && (
          <div className="flex items-center gap-4">
            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{scoreDisplay}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 uppercase font-medium">Puntaje Global</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Puntos Fuertes</h4>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
              {strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Puntos Débiles</h4>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
              {weaknesses.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {recommendation && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Recomendación</h4>
            <p className="text-slate-600 dark:text-slate-300">{recommendation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderNonverbalFeedback = (raw?: string | null) => {
    const parsed = tryParse(raw) as Record<string, unknown> | null;
    if (!parsed) return <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{raw || 'Sin análisis no verbal.'}</p>;

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
            <h5 className="text-xs text-slate-400 dark:text-slate-500 uppercase mb-1">Postura</h5>
            <p className="text-slate-700 dark:text-slate-300">{posture || '—'}</p>
          </div>
          <div>
            <h5 className="text-xs text-slate-400 dark:text-slate-500 uppercase mb-1">Contacto Visual</h5>
            <p className="text-slate-700 dark:text-slate-300">{eyeContact || '—'}</p>
          </div>
          <div>
            <h5 className="text-xs text-slate-400 dark:text-slate-500 uppercase mb-1">Uso de Manos</h5>
            <p className="text-slate-700 dark:text-slate-300">{hands || '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-xs text-slate-400 dark:text-slate-500 uppercase mb-1">Expresión Facial</h5>
            <p className="text-slate-700 dark:text-slate-300">{expression || '—'}</p>
          </div>
          <div>
            <h5 className="text-xs text-slate-400 dark:text-slate-500 uppercase mb-1">Nivel de Confianza</h5>
            <p className="text-slate-700 dark:text-slate-300">{confidence || '—'}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Fortalezas</h4>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Debilidades</h4>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
            {weaknesses.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        {recommendation && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Recomendación</h4>
            <p className="text-slate-600 dark:text-slate-300">{recommendation}</p>
          </div>
        )}
      </div>
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSeek = (seconds: number) => {
    if (!pitch?.sourceUrl) return;
    const youtubeId = extractYouTubeId(pitch.sourceUrl);
    if (iframeRef.current && youtubeId) {
      iframeRef.current.src = `https://www.youtube.com/embed/${youtubeId}?start=${Math.floor(seconds)}&autoplay=1`;
    }
    // scroll to player
    iframeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const highlightFillers = (text: string, fillers: string[]) => {
    if (!fillers.length) return <span>{text}</span>;
    const pattern = new RegExp(`(${fillers.map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(pattern);
    return (
      <>
        {parts.map((part, i) =>
          fillers.some(f => f.toLowerCase() === part.toLowerCase())
            ? <mark key={i} className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded px-0.5 font-medium">{part}</mark>
            : <span key={i}>{part}</span>
        )}
      </>
    );
  };

  const renderTranscriptionClips = (segments?: TranscriptionSegment[], silences?: Silence[]) => {
    if (!segments?.length) {
      return (
        <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {pitch?.transcription || 'Sin transcripción disponible.'}
          </p>
        </Card>
      );
    }

    const silenceMap = new Set((silences ?? []).map(s => s.inicio));

    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          {segments.length} segmentos · Las palabras en{' '}
          <mark className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded px-1 font-medium">amarillo</mark>{' '}
          son muletillas detectadas
        </p>

        {segments.map((seg, idx) => {
          const prevEnd = idx > 0 ? segments[idx - 1].fin : null;
          const gapSeconds = prevEnd !== null ? seg.inicio - prevEnd : 0;
          const isLongSilence = gapSeconds > 2 || (prevEnd !== null && silenceMap.has(prevEnd));

          const canSeek = !!pitch?.sourceUrl && !!extractYouTubeId(pitch.sourceUrl ?? '');

          return (
            <div key={seg.indice}>
              {isLongSilence && gapSeconds > 2 && (
                <div className="flex items-center gap-3 py-1 px-2">
                  <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-700" />
                  <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                    ⏸ silencio {gapSeconds.toFixed(1)}s
                  </span>
                  <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-700" />
                </div>
              )}
              <div
                onClick={() => canSeek && handleSeek(seg.inicio)}
                className={`flex gap-3 p-3 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-slate-600 transition-colors ${canSeek ? 'cursor-pointer' : ''}`}
              >
                <div className="shrink-0 text-right">
                  <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md block">
                    {formatTime(seg.inicio)}
                  </span>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 block mt-0.5 text-center">
                    {formatTime(seg.fin)}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {highlightFillers(seg.texto, seg.muletillas_detectadas)}
                </p>
              </div>
            </div>
          );
        })}
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

  const youtubeId = pitch.sourceUrl ? extractYouTubeId(pitch.sourceUrl) : null;

  const detectedErrors = [
    ...(pitch.verbalMetrics?.silences?.map(s => ({
      label: `Pausa larga detectada en ${formatTime(s.inicio)} (${s.duracion_segundos.toFixed(1)}s)`,
      seconds: s.inicio,
      type: 'silence' as const,
    })) ?? []),
    ...(pitch.transcriptionSegments
      ?.filter(s => s.muletillas_detectadas.length > 0)
      .map(s => ({
        label: `Muletilla "${s.muletillas_detectadas.join(', ')}" en ${formatTime(s.inicio)}`,
        seconds: s.inicio,
        type: 'filler' as const,
      })) ?? []),
  ].sort((a, b) => a.seconds - b.seconds);

  return (
    <div className="space-y-6">
      {isFallback && <ConnectionWarning />}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-blue-100 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{pitch.title}</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">ID de análisis: {pitch.id} • {pitch.date}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-2xl px-6 py-3 text-center self-stretch md:self-auto">
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{pitch.score}</div>
          <div className="text-xs font-medium text-blue-500 dark:text-blue-400 uppercase tracking-wider">Puntaje Global</div>
        </div>
      </div>

      {/* YouTube Player */}
      {youtubeId && (
        <div className="rounded-2xl overflow-hidden border border-blue-100 dark:border-slate-700 shadow-sm aspect-video w-full">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="Video del pitch"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      {/* Errores Detectados */}
      {detectedErrors.length > 0 && (
        <Card className="border-amber-100 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-900/10">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">
            ⚠ Errores Detectados{!youtubeId && <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-2">(haz clic para ver el momento en videos de YouTube)</span>}
          </h3>
          <div className="space-y-2">
            {detectedErrors.map((error, i) => (
              <button
                key={i}
                onClick={() => handleSeek(error.seconds)}
                disabled={!youtubeId}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                  error.type === 'silence'
                    ? 'border-blue-100 dark:border-blue-900/40 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 text-slate-700 dark:text-slate-300'
                    : 'border-amber-200 dark:border-amber-800/40 bg-white dark:bg-slate-800 hover:border-amber-400 dark:hover:border-amber-700 text-slate-700 dark:text-slate-300'
                } ${youtubeId ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md shrink-0">
                  {formatTime(error.seconds)}
                </span>
                <span>{error.label}</span>
                {youtubeId && <span className="ml-auto text-slate-300 dark:text-slate-600 text-xs">▶ ver</span>}
              </button>
            ))}
          </div>
        </Card>
      )}

      {pitch.status === 'processing' && (
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h3 className="text-base font-bold text-blue-800 dark:text-blue-300">Análisis en progreso</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">{currentStepLabel()}</p>
            </div>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{pitch.progressPercent ?? 0}%</div>
          </div>

          <div className="w-full h-2 rounded-full bg-blue-100 dark:bg-blue-900/50 overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
              style={{ width: `${pitch.progressPercent ?? 0}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 text-sm">
            {progressFlow.map((step) => {
              const done = Boolean(pitch.progressSteps?.[step.key]);
              return (
                <div key={step.key} className={`rounded-lg px-3 py-2 border ${
                  done
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                }`}>
                  <span className="mr-2">{done ? '✔' : '…'}</span>
                  {step.label}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {evolution?.previousId ? (
        <Card className="border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Métricas evolutivas</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Comparación contra el análisis anterior con la misma rúbrica.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full truncate max-w-xs">
              vs. {evolution.previousTitle || evolution.previousId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Δ Puntaje Global</div>
              <div className={`text-2xl font-bold mt-2 ${(evolution.deltaScore >= 0) ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatDelta(evolution.deltaScore, 'pts')}
              </div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Δ Palabras por minuto</div>
              <div className={`text-2xl font-bold mt-2 ${(evolution.deltaWpm >= 0) ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatDelta(evolution.deltaWpm, 'PPM')}
              </div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Δ Muletillas</div>
              <div className={`text-2xl font-bold mt-2 ${(evolution.deltaFillers <= 0) ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatDelta(evolution.deltaFillers, 'menciones')}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-400 dark:text-slate-500">
          <span>📈</span>
          <span>Las métricas evolutivas aparecerán aquí cuando tengas más de un análisis completado con la misma rúbrica.</span>
        </div>
      )}

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto gap-2 no-scrollbar">
        {(['content', 'verbal', 'nonverbal', 'transcription'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab === 'content' && '💡 Feedback de Contenido (LLM)'}
            {tab === 'verbal' && '📊 Métricas Verbales'}
            {tab === 'nonverbal' && '🎭 Comunicación No Verbal'}
            {tab === 'transcription' && `📝 Transcripción${pitch?.transcriptionSegments?.length ? ` (${pitch.transcriptionSegments.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Tab Panels Content */}
      <div className="mt-4">
        {activeTab === 'content' && (
          <Card>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Recomendaciones del Coach de IA</h3>
            {renderContentFeedback(pitch.contentFeedback)}
          </Card>
        )}

        {activeTab === 'verbal' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center">
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Muletillas Detectadas</div>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{pitch.verbalMetrics?.fillerWordsCount ?? 0}</div>
            </Card>
            <Card className="text-center">
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Velocidad de Habla</div>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">
                {pitch.verbalMetrics?.wordsPerMinute ?? 0}
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400"> PPM</span>
              </div>
            </Card>
            <Card className="text-center">
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Energía del Tono</div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{pitch.verbalMetrics?.toneEnergy ?? 'Sin datos'}</div>
            </Card>
          </div>
        )}

        {activeTab === 'nonverbal' && (
          <Card>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Análisis de Contacto Visual y Postura</h3>
            {renderNonverbalFeedback(pitch.nonVerbalFeedback)}
          </Card>
        )}

        {activeTab === 'transcription' && (
          <div>
            {renderTranscriptionClips(pitch.transcriptionSegments, pitch.verbalMetrics?.silences)}
          </div>
        )}
      </div>
    </div>
  );
}