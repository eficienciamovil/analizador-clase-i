import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ImportResult } from '../types/estado';
import { parsearArchivoExcel } from '../lib/excelParser';

type Props = {
  label: string;
  sublabel: string;
  result: ImportResult | null;
  onResult: (r: ImportResult | null) => void;
  accentColor?: string;
};

export function FileUpload({ label, sublabel, result, onResult, accentColor = 'border-slate-400' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|xlsm)$/i)) {
      alert('Por favor, cargue un archivo Excel (.xlsx, .xls o .xlsm)');
      return;
    }
    setLoading(true);
    try {
      const r = await parsearArchivoExcel(file);
      onResult(r);
    } catch (e) {
      alert(`Error al procesar el archivo: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleClear = () => {
    onResult(null);
  };

  if (result) {
    const hasErrors = result.errores.length > 0;
    const hasWarnings = result.advertencias.length > 0;
    return (
      <div className={`card p-4 border-l-4 ${hasErrors ? 'border-l-red-500' : 'border-l-green-500'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {hasErrors ? (
              <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={20} />
            ) : (
              <CheckCircle className="text-green-500 mt-0.5 shrink-0" size={20} />
            )}
            <div>
              <p className="font-semibold text-slate-800 text-sm">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5 break-all">{result.nombreArchivo}</p>
              {result.periodoDetectado && (
                <p className="text-xs text-slate-600 mt-1">
                  Período: <span className="font-medium">{result.periodoDetectado}</span>
                </p>
              )}
              {result.unidadDetectada && (
                <p className="text-xs text-slate-600">
                  Unidad: <span className="font-medium">{result.unidadDetectada}</span>
                </p>
              )}
              <p className="text-xs text-slate-600 mt-1">
                <span className="font-medium text-green-700">{result.items.length}</span> efectos importados
                {result.filasDescartadas.length > 0 && (
                  <span className="text-amber-600 ml-2">
                    · {result.filasDescartadas.length} filas descartadas
                  </span>
                )}
              </p>
              {hasErrors && (
                <div className="mt-2 space-y-1">
                  {result.errores.map((e, i) => (
                    <p key={i} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{e}</p>
                  ))}
                </div>
              )}
              {hasWarnings && !hasErrors && (
                <div className="mt-2 space-y-1">
                  {result.advertencias.slice(0, 2).map((w, i) => (
                    <p key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">{w}</p>
                  ))}
                  {result.advertencias.length > 2 && (
                    <p className="text-xs text-amber-600">+{result.advertencias.length - 2} advertencias más</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 transition-colors ml-2 shrink-0"
            title="Quitar archivo"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
        ${dragOver ? 'border-slate-500 bg-slate-50' : `${accentColor} hover:border-slate-500 hover:bg-slate-50`}
        ${loading ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.xlsm"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center gap-3">
        {loading ? (
          <div className="w-10 h-10 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            {dragOver ? <Upload size={24} className="text-slate-600" /> : <FileSpreadsheet size={24} className="text-slate-500" />}
          </div>
        )}
        <div>
          <p className="font-semibold text-slate-700 text-sm">{label}</p>
          <p className="text-xs text-slate-500 mt-1">{sublabel}</p>
          <p className="text-xs text-slate-400 mt-1">
            {loading ? 'Procesando...' : 'Clic para seleccionar o arrastre el archivo aquí'}
          </p>
          <p className="text-xs text-slate-400">.xlsx · .xls · .xlsm</p>
        </div>
      </div>
    </div>
  );
}
