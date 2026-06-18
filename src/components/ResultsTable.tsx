import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';
import type { ComparacionItem, SeveridadAlerta } from '../types/alertas';
import { AlertBadge } from './AlertBadge';
import { TIPO_ALERTA_LABELS, SEVERIDAD_ORDEN } from '../lib/constants';

type FilterType =
  | 'todos'
  | 'criticas'
  | 'altas'
  | 'sin_movimiento'
  | 'saldo_excesivo'
  | 'consumo_inmediato'
  | 'desaparecidos'
  | 'nuevos'
  | 'arrastre'
  | 'ingresos_excesivos'
  | 'saldo_negativo';

type Props = { items: ComparacionItem[] };

function fmt(n?: number, umd?: string): string {
  if (n === undefined || n === null) return '—';
  const formatted = n.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  return umd ? `${formatted} ${umd}` : formatted;
}

function fmtRatio(n?: number): string {
  if (n === undefined || n === null) return '—';
  return n.toFixed(2);
}

const SEV_BG: Record<SeveridadAlerta, string> = {
  critica: 'bg-red-50 border-l-red-500',
  alta: 'bg-orange-50 border-l-orange-400',
  media: 'bg-amber-50 border-l-amber-400',
  baja: 'bg-blue-50 border-l-blue-400',
  informativa: 'bg-slate-50 border-l-slate-300',
};

export function ResultsTable({ items }: Props) {
  const [filter, setFilter] = useState<FilterType>('todos');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>('severidad');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let list = [...items];

    // Apply filter
    switch (filter) {
      case 'criticas':
        list = list.filter((i) => i.alertas.some((a) => a.severidad === 'critica'));
        break;
      case 'altas':
        list = list.filter((i) => i.alertas.some((a) => a.severidad === 'alta'));
        break;
      case 'sin_movimiento':
        list = list.filter((i) => i.alertas.some((a) => a.tipo === 'sin_movimiento'));
        break;
      case 'consumo_inmediato':
        list = list.filter((i) => i.alertas.some((a) => a.tipo === 'consumo_inmediato_con_saldo'));
        break;
      case 'desaparecidos':
        list = list.filter((i) => i.estadoComparativo === 'solo_mes_anterior');
        break;
      case 'nuevos':
        list = list.filter((i) => i.estadoComparativo === 'solo_mes_posterior');
        break;
      case 'arrastre':
        list = list.filter((i) => i.alertas.some((a) => a.tipo === 'arrastre_saldo'));
        break;
      case 'ingresos_excesivos':
        list = list.filter((i) => i.alertas.some((a) => a.tipo === 'ingresos_excesivos' || a.tipo === 'ingreso_sin_consumo'));
        break;
      case 'saldo_excesivo':
        list = list.filter((i) => i.alertas.some((a) => a.tipo === 'saldo_excesivo'));
        break;
      case 'saldo_negativo':
        list = list.filter((i) => i.alertas.some((a) => a.tipo === 'saldo_negativo'));
        break;
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.codigo.toLowerCase().includes(q) ||
          i.descripcion.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'severidad':
          cmp = (SEVERIDAD_ORDEN[b.severidadMaxima ?? 'informativa'] ?? 0) -
                (SEVERIDAD_ORDEN[a.severidadMaxima ?? 'informativa'] ?? 0);
          break;
        case 'codigo':
          cmp = a.codigo.localeCompare(b.codigo);
          break;
        case 'descripcion':
          cmp = a.descripcion.localeCompare(b.descripcion);
          break;
        case 'arrastre':
          cmp = Math.abs(b.diferencia_arrastre ?? 0) - Math.abs(a.diferencia_arrastre ?? 0);
          break;
        case 'ratio':
          cmp = (b.ratio_ingreso_egreso ?? 0) - (a.ratio_ingreso_egreso ?? 0);
          break;
        case 'saldo':
          cmp = (b.itemMesPosterior?.saldoQuePasa ?? 0) - (a.itemMesPosterior?.saldoQuePasa ?? 0);
          break;
        case 'alertas':
          cmp = b.alertas.length - a.alertas.length;
          break;
      }
      return sortAsc ? -cmp : cmp;
    });

    return list;
  }, [items, filter, search, sortKey, sortAsc]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ k }: { k: string }) =>
    sortKey === k ? (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : null;

  const filterButtons: { key: FilterType; label: string; count?: number }[] = [
    { key: 'todos', label: 'Todos', count: items.length },
    { key: 'criticas', label: 'Críticas', count: items.filter((i) => i.alertas.some((a) => a.severidad === 'critica')).length },
    { key: 'altas', label: 'Altas', count: items.filter((i) => i.alertas.some((a) => a.severidad === 'alta')).length },
    { key: 'arrastre', label: 'Arrastre', count: items.filter((i) => i.alertas.some((a) => a.tipo === 'arrastre_saldo')).length },
    { key: 'sin_movimiento', label: 'Sin movimiento', count: items.filter((i) => i.alertas.some((a) => a.tipo === 'sin_movimiento')).length },
    { key: 'ingresos_excesivos', label: 'Ing. excesivos', count: items.filter((i) => i.alertas.some((a) => a.tipo === 'ingresos_excesivos' || a.tipo === 'ingreso_sin_consumo')).length },
    { key: 'saldo_excesivo', label: 'Saldo excesivo', count: items.filter((i) => i.alertas.some((a) => a.tipo === 'saldo_excesivo')).length },
    { key: 'consumo_inmediato', label: 'Cons. inmediato', count: items.filter((i) => i.alertas.some((a) => a.tipo === 'consumo_inmediato_con_saldo')).length },
    { key: 'saldo_negativo', label: 'Saldo negativo', count: items.filter((i) => i.alertas.some((a) => a.tipo === 'saldo_negativo')).length },
    { key: 'desaparecidos', label: 'Desaparecidos', count: items.filter((i) => i.estadoComparativo === 'solo_mes_anterior').length },
    { key: 'nuevos', label: 'Nuevos', count: items.filter((i) => i.estadoComparativo === 'solo_mes_posterior').length },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
              ${filter === key
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
              }`}
          >
            {label} {count !== undefined && <span className="ml-1 opacity-70">({count})</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por código o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <p className="text-xs text-slate-500">{filtered.length} efectos mostrados</p>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 text-slate-600 uppercase tracking-wide">
            <tr>
              {[
                { key: 'codigo', label: 'Código' },
                { key: 'descripcion', label: 'Descripción' },
                { key: null, label: 'Umd' },
                { key: null, label: 'Saldo ant. (A)' },
                { key: null, label: 'Saldo ini (P)' },
                { key: 'arrastre', label: 'Δ Arrastre' },
                { key: null, label: 'Ingresos (P)' },
                { key: null, label: 'Egresos (P)' },
                { key: 'saldo', label: 'Saldo pasa (P)' },
                { key: 'ratio', label: 'Ratio I/E' },
                { key: 'alertas', label: 'Alertas' },
                { key: 'severidad', label: 'Severidad' },
              ].map(({ key, label }) => (
                <th
                  key={label}
                  className={`px-3 py-2.5 text-left font-semibold whitespace-nowrap ${key ? 'cursor-pointer hover:bg-slate-200' : ''}`}
                  onClick={() => key && handleSort(key)}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    {key && <SortIcon k={key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                  No hay efectos que coincidan con los filtros aplicados.
                </td>
              </tr>
            )}
            {filtered.map((item) => {
              const isExpanded = expandedRow === item.codigo;
              const rowClass = item.severidadMaxima
                ? `border-l-4 ${SEV_BG[item.severidadMaxima]}`
                : 'bg-white';

              const arrDiff = item.diferencia_arrastre;
              const arrColor = arrDiff !== undefined && Math.abs(arrDiff) > 0.01
                ? 'text-red-600 font-semibold'
                : 'text-slate-400';

              return (
                <>
                  <tr
                    key={item.codigo}
                    className={`${rowClass} hover:bg-slate-50 cursor-pointer transition-colors`}
                    onClick={() => setExpandedRow(isExpanded ? null : item.codigo)}
                  >
                    <td className="px-3 py-2 font-mono text-slate-600">{item.codigo}</td>
                    <td className="px-3 py-2 font-medium text-slate-800 max-w-xs">
                      <span className="truncate block max-w-[200px]" title={item.descripcion}>
                        {item.descripcion}
                      </span>
                      {item.rubro && (
                        <span className="text-slate-400 text-xs">{item.rubro}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{item.umd}</td>
                    <td className="px-3 py-2 text-slate-600 tabular-nums">
                      {fmt(item.itemMesAnterior?.saldoQuePasa)}
                    </td>
                    <td className="px-3 py-2 text-slate-600 tabular-nums">
                      {fmt(item.itemMesPosterior?.saldoMesAnterior)}
                    </td>
                    <td className={`px-3 py-2 tabular-nums ${arrColor}`}>
                      {arrDiff !== undefined ? (Math.abs(arrDiff) > 0.001 ? arrDiff.toFixed(3) : '✓') : '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-600 tabular-nums">
                      {fmt(item.itemMesPosterior?.ingresos)}
                    </td>
                    <td className="px-3 py-2 text-slate-600 tabular-nums">
                      {fmt(item.itemMesPosterior?.egresos)}
                    </td>
                    <td className={`px-3 py-2 tabular-nums font-medium ${
                      (item.itemMesPosterior?.saldoQuePasa ?? 0) < 0 ? 'text-red-600' : 'text-slate-700'
                    }`}>
                      {fmt(item.itemMesPosterior?.saldoQuePasa)}
                    </td>
                    <td className={`px-3 py-2 tabular-nums ${
                      (item.ratio_ingreso_egreso ?? 0) >= 1.5 ? 'text-orange-600 font-medium' : 'text-slate-500'
                    }`}>
                      {fmtRatio(item.ratio_ingreso_egreso)}
                    </td>
                    <td className="px-3 py-2">
                      {item.alertas.length > 0 ? (
                        <span className="flex items-center gap-1 text-slate-600">
                          <AlertCircle size={12} />
                          {item.alertas.length}
                        </span>
                      ) : (
                        <span className="text-slate-300">
                          <Info size={12} />
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {item.severidadMaxima ? (
                        <AlertBadge severidad={item.severidadMaxima} />
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && item.alertas.length > 0 && (
                    <tr key={`${item.codigo}-detail`} className="bg-slate-50">
                      <td colSpan={12} className="px-6 py-3">
                        <div className="space-y-2">
                          {item.alertas.map((alerta, idx) => (
                            <div
                              key={idx}
                              className={`rounded-md p-3 border-l-4 ${SEV_BG[alerta.severidad]}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <AlertBadge severidad={alerta.severidad} />
                                    <span className="text-xs font-medium text-slate-600">
                                      {TIPO_ALERTA_LABELS[alerta.tipo] ?? alerta.tipo}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700">{alerta.descripcion}</p>
                                  <p className="text-xs text-slate-500 mt-1 italic">
                                    Recomendación: {alerta.recomendacion}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
