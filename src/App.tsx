import { useState } from 'react';
import { FileText, BarChart2, TableIcon, RefreshCw, Download, Shield } from 'lucide-react';
import { useAppStore } from './store/appStore';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { ResultsTable } from './components/ResultsTable';
import { SettingsPanel } from './components/SettingsPanel';
import { ImportSummary } from './components/ImportSummary';
import { compararEstados, calcularResumenAlertas } from './lib/comparisonEngine';
import { calcularScoring } from './lib/scoringEngine';
import { generarPDF } from './lib/pdfGenerator';

type Tab = 'dashboard' | 'tabla' | 'importacion';

export default function App() {
  const {
    importAnterior, importPosterior,
    setImportAnterior, setImportPosterior,
    comparacion, resumen, scoring,
    setComparacion, setLoading, loading, config, reset,
  } = useAppStore();

  const [tab, setTab] = useState<Tab>('dashboard');
  const [analyzed, setAnalyzed] = useState(false);

  const canAnalyze = importAnterior !== null && importPosterior !== null && !loading;

  const handleAnalyze = () => {
    if (!importAnterior || !importPosterior) return;

    if (importAnterior.nombreArchivo === importPosterior.nombreArchivo) {
      if (!window.confirm('Los dos archivos tienen el mismo nombre. ¿Desea continuar de todas formas?')) return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        const items = compararEstados(importAnterior.items, importPosterior.items, config);
        const res = calcularResumenAlertas(items);
        const sc = calcularScoring(items, config);
        setComparacion(items, res, sc);
        setAnalyzed(true);
        setTab('dashboard');
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  const handleReset = () => {
    reset();
    setAnalyzed(false);
    setTab('dashboard');
  };

  const handlePdf = () => {
    if (!comparacion || !resumen || !scoring || !importAnterior || !importPosterior) return;
    generarPDF(comparacion, resumen, scoring, importAnterior, importPosterior);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
              <Shield size={20} className="text-slate-200" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight tracking-wide">
                Analizador de Estados de Abastecimiento
              </h1>
              <p className="text-xs text-slate-400 leading-tight">
                Efectos Clase I — Ejército Argentino
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SettingsPanel />
            {analyzed && (
              <>
                <button onClick={handlePdf} className="btn-secondary flex items-center gap-2 text-xs">
                  <Download size={14} />
                  Exportar PDF
                </button>
                <button onClick={handleReset} className="btn-secondary flex items-center gap-2 text-xs">
                  <RefreshCw size={14} />
                  Nuevo análisis
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* File upload */}
        {!analyzed && (
          <div className="mb-6">
            <div className="card p-6">
              <h2 className="text-base font-semibold text-slate-700 mb-1">
                Cargar Estados de Abastecimiento
              </h2>
              <p className="text-sm text-slate-500 mb-5">
                Seleccione los archivos Excel correspondientes a dos meses consecutivos.
                La hoja{' '}
                <code className="bg-slate-100 px-1 rounded text-xs font-mono">Est Abast</code>{' '}
                será detectada automáticamente.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <FileUpload
                  label="Mes anterior"
                  sublabel="Estado de Abastecimiento del mes previo"
                  result={importAnterior}
                  onResult={setImportAnterior}
                  accentColor="border-blue-300"
                />
                <FileUpload
                  label="Mes posterior"
                  sublabel="Estado de Abastecimiento del mes a analizar"
                  result={importPosterior}
                  onResult={setImportPosterior}
                  accentColor="border-slate-400"
                />
              </div>

              {importAnterior && importPosterior && (
                <div className="flex justify-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={!canAnalyze}
                    className="btn-primary flex items-center gap-2 px-8 py-3 text-base"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <BarChart2 size={18} />
                        Ejecutar análisis comparativo
                      </>
                    )}
                  </button>
                </div>
              )}

              {(!importAnterior || !importPosterior) && (
                <p className="text-center text-xs text-slate-400 mt-3">
                  Cargue ambos archivos para habilitar el análisis.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {analyzed && comparacion && resumen && scoring && importAnterior && importPosterior && (
          <>
            <div className="border-b border-slate-200 mb-5">
              <nav className="flex gap-1">
                {(
                  [
                    { key: 'dashboard', label: 'Tablero', icon: BarChart2 },
                    { key: 'tabla', label: `Tabla de resultados (${comparacion.length})`, icon: TableIcon },
                    { key: 'importacion', label: 'Resumen de importación', icon: FileText },
                  ] as const
                ).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                      ${tab === key
                        ? 'border-slate-800 text-slate-800'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {tab === 'dashboard' && (
              <Dashboard
                items={comparacion}
                resumen={resumen}
                scoring={scoring}
                importAnterior={importAnterior}
                importPosterior={importPosterior}
              />
            )}
            {tab === 'tabla' && <ResultsTable items={comparacion} />}
            {tab === 'importacion' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ImportSummary label="Mes anterior" result={importAnterior} />
                <ImportSummary label="Mes posterior" result={importPosterior} />
              </div>
            )}

            <div className="mt-6 card p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  ¿Modificó la configuración?
                </p>
                <p className="text-xs text-slate-500">
                  Re-ejecute el análisis para aplicar los nuevos parámetros.
                </p>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <RefreshCw size={14} />
                Re-analizar
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-10 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs text-slate-400 text-center">
            Herramienta de análisis de consistencia logística — Uso interno.
            Los resultados son de carácter preliminar y no reemplazan el criterio del responsable logístico.
          </p>
        </div>
      </footer>
    </div>
  );
}
