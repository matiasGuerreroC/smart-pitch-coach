'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { api, ExtractedRubric } from '../../lib/api';
import { Rubric } from '../../types';

export default function RubricsPage() {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'review'>('idle');
  const [extractedData, setExtractedData] = useState<ExtractedRubric | null>(null);
  const [rubricName, setRubricName] = useState('');
  const [rubricDescription, setRubricDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rubricId, setRubricId] = useState<string | null>(null);

  useEffect(() => {
    api.getRubrics().then(setRubrics);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcessFile = async () => {
    if (!file) return;
    
    setStatus('uploading');
    // Simulamos la subida rápida
    await new Promise(r => setTimeout(r, 800));
    
    setStatus('analyzing');
    // Llamamos al servicio (que simula el LLM procesando el PDF/Excel)
    try {
      const data = await api.uploadRubricFile(file);
      setRubricId(data.id);
      setExtractedData(data);
      setRubricName(data.name || 'Rúbrica generada');
      setRubricDescription(`Rúbrica generada con ${data.suggestedCriteria.length} criterios.`);
      setStatus('review');
    } catch (error) {
      alert("Error procesando el archivo");
      setStatus('idle');
      setFile(null);
    }
  };

  const handleConfirmRubric = async () => {
    if (!extractedData) return;
    try {
      await api.saveRubric({
        id: rubricId ?? undefined,
        name: rubricName.trim() || extractedData.name,
        description: rubricDescription.trim() || 'Rúbrica generada por IA.',
        criteria: extractedData.suggestedCriteria,
      });
      alert(`Rúbrica guardada exitosamente con ${extractedData.suggestedCriteria.length} criterios.`);
      setStatus('idle');
      setFile(null);
      setExtractedData(null);
      setRubricName('');
      setRubricDescription('');
      api.getRubrics().then(setRubrics);
    } catch (error) {
      alert('No se pudo guardar la rúbrica.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Listado de Rúbricas (Columna Izquierda) */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mis Rúbricas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Archivos analizados y convertidos en criterios de evaluación por la IA.
          </p>
        </div>

        <div className="space-y-3">
          {rubrics.map((r) => (
            <Card key={r.id}>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{r.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{r.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Zona de Subida y Procesamiento (Columna Derecha) */}
      <div>
        <Card className="sticky top-24 border-blue-100 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
            <span className="mr-2">✨</span> Nueva Rúbrica con IA
          </h2>

          {status === 'idle' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Sube un PDF o Word. Nuestra IA leerá el documento y extraerá automáticamente los puntos clave a evaluar.
              </p>
              
              <div 
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  accept=".pdf,.xlsx,.xls,.csv"
                  onChange={handleFileChange}
                />
                <div className="text-3xl mb-2">📄</div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {file ? file.name : "Haz clic para buscar un archivo"}
                </div>
                {!file && <div className="text-xs text-slate-400 mt-1">PDF, Word (.pdf, .docx)</div>}
              </div>

              <button 
                onClick={handleProcessFile}
                disabled={!file}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Procesar Documento
              </button>
            </div>
          )}

          {(status === 'uploading' || status === 'analyzing') && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <div className="text-slate-700 dark:text-slate-300 font-medium">
                {status === 'uploading' ? 'Subiendo archivo seguro...' : 'IA extrayendo criterios de evaluación...'}
              </div>
              <p className="text-xs text-slate-500">Esto puede tomar unos segundos.</p>
            </div>
          )}

          {status === 'review' && extractedData && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm border border-emerald-200 dark:border-emerald-800">
                ✅ Extracción completada. Revisa los puntos antes de guardar.
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Nombre Detectado</label>
                <input 
                  type="text" 
                  value={rubricName}
                  onChange={(e) => setRubricName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={rubricDescription}
                  onChange={(e) => setRubricDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Criterios Extraídos</label>
                <ul className="space-y-2">
                  {extractedData.suggestedCriteria.map((crit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => { setStatus('idle'); setFile(null); }}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmRubric}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                >
                  Guardar Rúbrica
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}