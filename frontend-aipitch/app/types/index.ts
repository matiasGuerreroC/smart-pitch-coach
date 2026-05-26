// types/index.ts
export interface Analysis {
  id: string;
  title: string;
  date: string;
  score: number;
  status: 'completed' | 'processing' | 'failed';
  rubricName?: string;
  transcription?: string;
  verbalMetrics?: {
    fillerWordsCount: number;
    wordsPerMinute: number;
    toneEnergy: string;
  };
  contentFeedback?: string; // mapeamos las recomendaciones del LLM
  nonVerbalFeedback?: string;
}

export interface Rubric {
  id: string;
  name: string;
  description: string;
}