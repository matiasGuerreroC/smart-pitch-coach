// types/index.ts
export interface TranscriptionSegment {
  indice: number;
  inicio: number;
  fin: number;
  duracion_segundos: number;
  texto: string;
  muletillas_detectadas: string[];
}

export interface Silence {
  inicio: number;
  duracion_segundos: number;
}

export interface Analysis {
  id: string;
  title: string;
  date: string;
  score: number;
  sourceUrl?: string;
  status: 'completed' | 'processing' | 'failed';
  progressPercent?: number;
  progressSteps?: {
    transcription?: boolean;
    verbal_metrics?: boolean;
    content?: boolean;
    nonverbal?: boolean;
  };
  rubricName?: string;
  transcription?: string;
  transcriptionSegments?: TranscriptionSegment[];
  verbalMetrics?: {
    fillerWordsCount: number;
    wordsPerMinute: number;
    toneEnergy: string;
    silences?: Silence[];
  };
  contentFeedback?: string;
  nonVerbalFeedback?: string;
  evolutionMetrics?: {
    deltaScore: number;
    deltaWpm: number;
    deltaFillers: number;
    previousId: string;
    previousTitle?: string;
  };
}

export interface Rubric {
  id: string;
  name: string;
  description: string;
}