// lib/api.ts
import { Analysis, Rubric } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// Función genérica de fetch
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers || {});
  
  // Solo forzamos JSON si NO es un FormData y no se ha definido otro Content-Type
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

export interface ExtractedRubric {
  id: string;
  name: string;
  suggestedCriteria: string[];
}

export interface CreateRubricPayload {
  id?: string;
  name: string;
  description: string;
  criteria: string[];
}

type HistoryRecord = {
  analysis_id: string;
  title: string;
  created_at: string;
  source_url?: string;
  rubric_id?: string | null;
  rubric_name?: string | null;
  status?: string;
  steps?: Record<string, boolean>;
  score?: number;
  transcription?: string;
  content_evaluation?: string | null;
  nonverbal_evaluation?: { analysis?: string | null } | null;
};

type SessionResponse = {
  analysis_id: string;
  status: string;
  steps: Record<string, boolean>;
  data: {
    video_metadata?: { title?: string; webpage_url?: string };
    score?: number;
    transcription?: string | null;
    verbal_metrics?: {
      cantidad_muletillas?: number;
      palabras_por_minuto?: number;
      nivel_velocidad?: string;
    } | null;
    content_evaluation?: string | null;
    nonverbal_evaluation?: { analysis?: string | null } | null;
    evolution_metrics?: {
      delta_score?: number;
      delta_wpm?: number;
      delta_fillers?: number;
      previous_id?: string;
    } | null;
  };
};

function mapHistoryRecord(record: HistoryRecord): Analysis {
  return {
    id: record.analysis_id,
    title: record.title || 'Análisis sin título',
    date: record.created_at ? new Date(record.created_at).toLocaleDateString() : 'Sin fecha',
    score: record.score ?? 0,
    status: record.status === 'completed' ? 'completed' : record.status === 'failed' ? 'failed' : 'processing',
    rubricName: record.rubric_name || undefined,
  };
}

function mapHistoryDetail(record: HistoryRecord): Analysis {
  return {
    ...mapHistoryRecord(record),
    transcription: record.transcription || undefined,
    verbalMetrics: undefined,
    contentFeedback: formatContentEvaluation(record.content_evaluation),
    nonVerbalFeedback: record.nonverbal_evaluation?.analysis || undefined,
    evolutionMetrics: undefined,
  };
}

function formatContentEvaluation(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  try {
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed, null, 2);
    }
    return JSON.stringify(raw, null, 2);
  } catch (e) {
    return raw;
  }
}

function mapSessionResponse(payload: SessionResponse): Analysis {
  return {
    id: payload.analysis_id,
    title: payload.data?.video_metadata?.title || 'Análisis sin título',
    date: new Date().toLocaleDateString(),
    score: payload.data?.score ?? 0,
    status: payload.status === 'success' ? 'processing' : 'failed',
    transcription: payload.data?.transcription || undefined,
    verbalMetrics: payload.data?.verbal_metrics
      ? {
          fillerWordsCount: payload.data.verbal_metrics.cantidad_muletillas ?? 0,
          wordsPerMinute: payload.data.verbal_metrics.palabras_por_minuto ?? 0,
          toneEnergy: payload.data.verbal_metrics.nivel_velocidad ?? 'N/A',
        }
      : undefined,
    contentFeedback: formatContentEvaluation(payload.data?.content_evaluation) || undefined,
    nonVerbalFeedback: payload.data?.nonverbal_evaluation?.analysis || undefined,
    evolutionMetrics: payload.data?.evolution_metrics
      ? {
          deltaScore: payload.data.evolution_metrics.delta_score ?? 0,
          deltaWpm: payload.data.evolution_metrics.delta_wpm ?? 0,
          deltaFillers: payload.data.evolution_metrics.delta_fillers ?? 0,
          previousId: payload.data.evolution_metrics.previous_id ?? '',
        }
      : undefined,
  };
}

// ---- SERVICIOS ----
export const api = {
  getHistory: () => 
    fetchApi<HistoryRecord[]>('/analysis', { method: 'GET' }).then((items) => items.map(mapHistoryRecord)),
    
  getAnalysisDetail: (id: string) => 
    fetchApi<SessionResponse>(`/analysis/${id}`, { method: 'GET' })
      .then(mapSessionResponse)
      .catch(async () => {
        const record = await fetchApi<HistoryRecord>(`/analysis/history/${id}`, { method: 'GET' });
        return mapHistoryDetail(record);
      }),

  startAnalysis: async (params: { type: 'url' | 'upload'; payload: string | File; rubricId: string }) => {
    if (params.type === 'upload') {
      const file = params.payload as File;
      const formData = new FormData();
      formData.append('file', file);
      if (params.rubricId) {
        formData.append('rubricId', params.rubricId);
      }
      return fetchApi<SessionResponse>('/analysis/upload', { method: 'POST', body: formData });
    } 
    
    return fetchApi<SessionResponse>('/analysis/start', { 
      method: 'POST', 
      body: JSON.stringify({ youtube_url: params.payload as string, rubric_id: params.rubricId }) 
    });
  },

  getRubrics: () => 
    fetchApi<Rubric[]>('/rubrics', { method: 'GET' }),

  uploadRubricFile: async (file: File): Promise<ExtractedRubric> => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi<ExtractedRubric>('/rubrics/extract', {
      method: 'POST',
      body: formData,
    });
  },

  saveRubric: (payload: CreateRubricPayload) =>
    fetchApi<Rubric>('/rubrics', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};