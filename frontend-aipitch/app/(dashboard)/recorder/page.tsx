'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../components/ui/Card';
import { api } from '../../lib/api';
import { Rubric } from '../../types';

export default function RecorderPage() {
  const router = useRouter();
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados del formulario
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedRubric, setSelectedRubric] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getRubrics().then(data => {
      setRubrics(data);
      if (data.length > 0) setSelectedRubric(data[0].id);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRubric) return alert('Selecciona una rúbrica primero.');
    if (mode === 'url' && !url) return alert('Ingresa una URL válida.');
    if (mode === 'upload' && !file) return alert('Sube un archivo de video.');

    setLoading(true);

    try {
      const payload = mode === 'url' ? url : file!;
      const response = await api.startAnalysis({ type: mode, payload, rubricId: selectedRubric });
      setUrl('');
      setFile(null);
      router.push(`/history/${response.analysis_id}`);
    } catch {
      alert('Ocurrió un error al enviar el video.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Analizar Pitch</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Sube un archivo desde tu dispositivo o pega un enlace externo.
        </p>
      </div>

      <Card>
        {/* Selector de Modos (Tabs) */}
        <div className="flex p-1 mb-6 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === 'url' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🌐 Enlace (URL)
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === 'upload' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            📁 Subir Archivo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Renderizado condicional del Input */}
          {mode === 'url' ? (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                URL del Video (YouTube / Google Drive)
              </label>
              <input 
                type="url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          ) : (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Archivo de Video Local
              </label>
              <div 
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-1 text-center">
                  <div className="text-4xl mb-3">🎬</div>
                  <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                    <span className="relative font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {file ? file.name : 'Haz clic para seleccionar tu video'}
                    </span>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      accept="video/mp4,video/x-m4v,video/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  {!file && <p className="text-xs text-slate-500">MP4, MOV, WEBM hasta 500MB</p>}
                </div>
              </div>
            </div>
          )}

          {/* Selector de Rúbricas (Común para ambos modos) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Seleccionar Rúbrica de Evaluación
            </label>
            <select 
              value={selectedRubric}
              onChange={(e) => setSelectedRubric(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            >
              <option value="" disabled>Selecciona una rúbrica...</option>
              {rubrics.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 flex justify-center items-center rounded-xl hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-wait shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'upload' ? 'Subiendo y procesando...' : 'Procesando enlace...'}
              </>
            ) : (
              'Comenzar Análisis'
            )}
          </button>
        </form>
      </Card>
      
      {/* Carrusel de Tips Mock */}
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm text-center border border-blue-100 dark:border-blue-900/50">
        💡 <strong>Tip del Coach:</strong> Asegúrate de que el audio sea claro y mantén contacto visual constante con el lente de la cámara.
      </div>
    </div>
  );
}