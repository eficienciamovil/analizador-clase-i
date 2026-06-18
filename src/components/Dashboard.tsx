import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import type { ComparacionItem, ResumenAlertas } from '../types/alertas';
import type { ResultadoScoring } from '../types/scoring';
import type { ImportResult } from '../types/estado';
import { AlertBadge } from './AlertBadge';
import { TIPO_ALERTA_LABELS } from '../lib/constants';

type Props = {
  items: ComparacionItem[];
  resumen: ResumenAlertas;
  scoring: ResultadoScoring;
  importAnterior: ImportResult;
  importPosterior: ImportResult;
};

const COLORS_PIE: Record<string, string> = {
  Crítica: '#dc2626',
  Alta: '#ea580c',
  Media: '#d97706',
  Baja: '#2563eb',
  Informativa: '#64748b',
};

export function Dashboard({ items, resumen, scoring, importAnterior, importPosterior }: Props) {
  const presentes = items.filter((i) => i.estadoComparativo === 'presente_en_ambos').length;
  const soloAnt = items.filter((i) => i.estadoComparativo === 'solo_mes_anterior').length;
  const soloPost = items.filter((i) => i.estadoComparativo === 'solo_mes_posterior').length;

  // Alerts by severity for pie
  const pieData = [
    { name: 'Crítica', value: resumen.criticas },
    { name: 'Alta', value: resumen.altas },
    { name: 'Media', value: resumen.medias },
    { name: 'Baja', value: resumen.bajas },
    { name: 'Informativa', value: resumen.informativas },
  ].filter((d) => d.value > 0);

  // Alerts by type
  const tipoCount: Record<string, number> = {};
  for (const item of items) {
    for (const a of item.alertas) {
      tipoCount[a.tipo] = (tipoCount[a.tipo] ?? 0) + 1;
    }
  }
  const barData = Object.entries(tipoCount)
    .map(([tipo, count]) => ({ tipo: TIPO_ALERTA_LABELS[tipo] ?? tipo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Top 10 ratio
  const top10Ratio = [...items]
    .filter((i) => i.ratio_ingreso_egreso !== undefined)
    .sort((a, b) => (b.ratio_ingreso_egreso ?? 0) - (a.ratio_ingreso_egreso ?? 0))
    .slice(0, 10)
    .map((i) => ({
      desc: i.descripcion.substring(0, 20),
      ratio: parseFloat((i.ratio_ingreso_egreso ?? 0).toFixed(2)),
    }));

  // Top 10 saldo
  const top10Saldo = [...items]
    .filter((i) => (i.itemMesPosterior?.saldoQuePasa ?? 0) > 0)
    .sort((a, b) => (b.itemMesPosterior?.saldoQuePasa ?? 0) - (a.itemMesPosterior?.saldoQuePasa ?? 0))
    .slice(0, 10)
    .map((i) => ({
      desc: i.descripcion.substring(0, 20),
      saldo: i.itemMesPosterior?.saldoQuePasa ?? 0,
    }));

  const scoreColor = scoring.color;

  return (
    <div className="space-y-6">
      {/* Header cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Efectos mes anterior" value={importAnterior.items.length} />
        <StatCard label="Efectos mes posterior" value={importPosterior.items.length} />
        <StatCard label="Presentes en ambos" value={presentes} color="text-green-700" />
        <StatCard label="Total alertas" value={resumen.total} color={resumen.total > 0 ? 'text-red-600' : 'text-green-700'} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Solo mes anterior" value={soloAnt} color={soloAnt > 0 ? 'text-amber-700' : undefined} />
        <StatCard label="Solo mes posterior" value={soloPost} color={soloPost > 0 ? 'text-amber-700' : undefined} />
        <StatCard label="Filas descartadas (ant.)" value={importAnterior.filasDescartadas.length} />
        <StatCard label="Filas descartadas (post.)" value={importPosterior.filasDescartadas.length} />
      </div>

      {/* Scoring + Alert summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Calificación técnica
          </h3>
          <div className="flex items-center gap-4">
            <div
              className="text-5xl font-bold tabular-nums leading-none"
              style={{ color: scoreColor }}
            >
              {scoring.puntaje.toFixed(1)}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: scoreColor }}>
                {scoring.etiqueta}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">/ 100 puntos</p>
              <p className="text-xs text-slate-400">Penalización: -{scoring.detalle.totalPenalizacion.toFixed(1)} pts</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 italic">
            Indicador técnico parametrizable. No reemplaza el criterio profesional.
          </p>
        </div>

        {/* Alert severity summary */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Alertas por severidad
          </h3>
          <div className="flex flex-wrap gap-2">
            {(['critica', 'alta', 'media', 'baja', 'informativa'] as const).map((sev) => (
              <div key={sev} className="flex items-center gap-2">
                <AlertBadge severidad={sev} count={resumen[sev === 'critica' ? 'criticas' : sev === 'alta' ? 'altas' : sev === 'media' ? 'medias' : sev === 'baja' ? 'bajas' : 'informativas']} />
              </div>
            ))}
          </div>
          {pieData.length > 0 && (
            <div className="mt-3 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={55}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                    fontSize={9}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS_PIE[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bar chart by type */}
      {barData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Alertas por tipo de control
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 120, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="tipo"
                  tick={{ fontSize: 10 }}
                  width={120}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#475569" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top 10 ratio */}
      {top10Ratio.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Top 10 — Mayor ratio ingreso/egreso (mes posterior)
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Ratio} layout="vertical" margin={{ left: 120, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="desc" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="ratio" fill="#ea580c" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top 10 saldo */}
      {top10Saldo.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Top 10 — Mayor saldo que pasa (mes posterior)
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Saldo} layout="vertical" margin={{ left: 120, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="desc" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="saldo" fill="#2563eb" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color ?? 'text-slate-800'}`}>
        {value.toLocaleString('es-AR')}
      </p>
    </div>
  );
}
