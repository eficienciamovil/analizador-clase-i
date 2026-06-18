import { useState } from 'react';
import { Settings, X, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const { config, setConfig } = useAppStore();
  const [newProducto, setNewProducto] = useState('');

  const addProducto = () => {
    const p = newProducto.trim().toLowerCase();
    if (p && !config.productosConsumoInmediato.includes(p)) {
      setConfig({ productosConsumoInmediato: [...config.productosConsumoInmediato, p] });
    }
    setNewProducto('');
  };

  const removeProducto = (p: string) => {
    setConfig({ productosConsumoInmediato: config.productosConsumoInmediato.filter((x) => x !== p) });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary flex items-center gap-2"
        title="Configuración"
      >
        <Settings size={16} />
        Configuración
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-slate-800">Configuración de parámetros</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Tolerancia decimal */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">
                  Tolerancia decimal para arrastre de saldo
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={config.toleranciaDecimal}
                  onChange={(e) => setConfig({ toleranciaDecimal: parseFloat(e.target.value) || 0.01 })}
                  className="w-32 border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Diferencia mínima para generar alerta de arrastre.
                </p>
              </div>

              {/* Umbral ingresos */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">
                  Umbral ratio ingresos / egresos
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={config.umbralIngresoEgresoRatio}
                  onChange={(e) => setConfig({ umbralIngresoEgresoRatio: parseFloat(e.target.value) || 1.5 })}
                  className="w-32 border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Alerta cuando ingresos ≥ egresos × este factor. (Ej.: 1.5 = 50% más)
                </p>
              </div>

              {/* Umbral saldo */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">
                  Umbral ratio saldo / egresos
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={config.umbralSaldoEgresoRatio}
                  onChange={(e) => setConfig({ umbralSaldoEgresoRatio: parseFloat(e.target.value) || 1.5 })}
                  className="w-32 border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Alerta cuando saldo que pasa ≥ egresos × este factor.
                </p>
              </div>

              {/* Penalizaciones */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Penalizaciones de calificación
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['critica', 'alta', 'media', 'baja', 'informativa'] as const).map((sev) => (
                    <div key={sev} className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 w-24 capitalize">{sev}:</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={config.penalizaciones[sev]}
                        onChange={(e) =>
                          setConfig({
                            penalizaciones: {
                              ...config.penalizaciones,
                              [sev]: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-20 border border-slate-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-slate-400">pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Productos consumo inmediato */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Efectos de consumo inmediato (saldo = 0)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {config.productosConsumoInmediato.map((p) => (
                    <span
                      key={p}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs text-slate-700"
                    >
                      {p}
                      <button onClick={() => removeProducto(p)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Agregar producto..."
                    value={newProducto}
                    onChange={(e) => setNewProducto(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addProducto()}
                    className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-sm"
                  />
                  <button onClick={addProducto} className="btn-secondary flex items-center gap-1 text-xs">
                    <Plus size={14} />
                    Agregar
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Texto parcial (no distingue mayúsculas/acentos).
                </p>
              </div>
            </div>

            <div className="p-5 border-t flex justify-end">
              <button onClick={() => setOpen(false)} className="btn-primary">
                Aplicar y cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
