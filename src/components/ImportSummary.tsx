import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ImportResult } from '../types/estado';

type Props = {
  label: string;
  result: ImportResult;
};

export function ImportSummary({ label, result }: Props) {
  const [showDiscarded, setShowDiscarded] = useState(false);

  return (
    <div className="card p-4 text-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-700">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{result.nombreArchivo}</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-slate-800">{result.items.length}</span>
          <p className="text-xs text-slate-400">efectos</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-slate-500">Encabezado</p>
          <p className="font-medium text-slate-700">Fila {result.encabezadoFila}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total filas</p>
          <p className="font-medium text-slate-700">{result.totalFilas}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Descartadas</p>
          <p className={`font-medium ${result.filasDescartadas.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {result.filasDescartadas.length}
          </p>
        </div>
      </div>

      {result.errores.length > 0 && (
        <div className="mt-3 space-y-1">
          {result.errores.map((e, i) => (
            <p key={i} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{e}</p>
          ))}
        </div>
      )}

      {result.advertencias.length > 0 && (
        <div className="mt-2 space-y-1">
          {result.advertencias.map((w, i) => (
            <p key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">{w}</p>
          ))}
        </div>
      )}

      {result.filasDescartadas.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowDiscarded(!showDiscarded)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            {showDiscarded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Ver filas descartadas ({result.filasDescartadas.length})
          </button>
          {showDiscarded && (
            <div className="mt-2 max-h-36 overflow-y-auto space-y-1">
              {result.filasDescartadas.map((f, i) => (
                <div key={i} className="text-xs bg-slate-50 rounded px-2 py-1">
                  <span className="font-mono text-slate-500">Fila {f.fila}:</span>{' '}
                  <span className="text-slate-600">{f.razon}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
