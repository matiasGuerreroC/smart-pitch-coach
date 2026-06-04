'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../components/ui/Card';
import { api } from '../../lib/api';
import { Rubric } from '../../types';

const MAX_SIZE_MB = 500;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function RecorderPage() {
  const router = useRouter();
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState('');

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
    setFileError('');
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/x-msvideo', 'video/avi'];
    if (!selected.type.startsWith('video/') && !allowedTypes.includes(selected.type)) {
      setFileError('Formato no soportado. Sube un video MP4, MOV, WebM o AVI.');
      e.target.value = '';
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setFileError(`El video excede el límite máximo de ${MAX_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }

    setFile(selected);
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
        <div className="flex p-1 mb-6 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('url'); setFileError(''); }}
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
            onClick={() => { setMode('upload'); setFileError(''); }}
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
          {mode === 'url' ? (
            <div className="animate-fade-in flex flex-col items-center gap-4 py-6 text-center">
              <span className="text-5xl">🚧</span>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-base">
                  YouTube no disponible en esta versión
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Los proveedores cloud bloquean las descargas de YouTube, por lo que esta función no está disponible en el MVP.
                  Por ahora, descarga tu video y súbelo directamente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMode('upload')}
                className="mt-1 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
              >
                Subir video →
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Archivo de Video Local
              </label>
              <div
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition cursor-pointer ${
                  fileError
                    ? 'border-rose-400 dark:border-rose-600 bg-rose-50 dark:bg-rose-900/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-1 text-center">
                  <div className="text-4xl mb-3">{fileError ? '⚠️' : '🎬'}</div>
                  <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                    <span className="relative font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {file ? file.name : 'Haz clic para seleccionar tu video'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/x-msvideo,video/avi"
                      onChange={handleFileChange}
                    />
                  </div>
                  {!file && !fileError && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">MP4, MOV, WebM, AVI · Máximo {MAX_SIZE_MB}MB</p>
                  )}
                </div>
              </div>

              {fileError && (
                <p className="mt-2 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <span>⚠</span> {fileError}
                </p>
              )}
            </div>
          )}

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
            disabled={loading || !!fileError}
            className="w-full bg-blue-600 text-white font-semibold py-3 flex justify-center items-center rounded-xl hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'upload' ? 'Subiendo y procesando...' : 'Procesando enlace...'}
              </>
            ) : 'Comenzar Análisis'}
          </button>
        </form>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm text-center border border-blue-100 dark:border-blue-900/50">
        💡 <strong>Tip del Coach:</strong> Asegúrate de que el audio sea claro y mantén contacto visual constante con el lente de la cámara.
      </div>
    </div>
  );
}
