import type { ConfiguracionApp } from '../types/scoring';

export const CONFIG_DEFAULT: ConfiguracionApp = {
  toleranciaDecimal: 0.01,
  umbralIngresoEgresoRatio: 1.5,
  umbralSaldoEgresoRatio: 1.5,
  productosConsumoInmediato: [
    'pan',
    'pizza',
    'prepizza',
    'masa',
    'facturas',
    'medialunas',
  ],
  productosParaPlanB: [
    'carne',
    'pollo',
    'verdura',
    'fruta',
    'lácteo',
    'lacteo',
    'pan',
    'pizza',
  ],
  penalizaciones: {
    critica: 15,
    alta: 8,
    media: 4,
    baja: 2,
    informativa: 0.5,
  },
};

export const ENCABEZADO_KEYWORDS = [
  'código',
  'codigo',
  'descripción',
  'descripcion',
  'umd',
  'saldo mes',
  'ingresos',
  'egresos',
  'saldo que',
];

export const NOMBRE_HOJA = 'Est Abast';

export const SEVERIDAD_ORDEN: Record<string, number> = {
  critica: 5,
  alta: 4,
  media: 3,
  baja: 2,
  informativa: 1,
};

export const SEVERIDAD_LABELS: Record<string, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
  informativa: 'Informativa',
};

export const TIPO_ALERTA_LABELS: Record<string, string> = {
  arrastre_saldo: 'Arrastre de saldo',
  consumo_inmediato_con_saldo: 'Consumo inmediato con saldo',
  sin_movimiento: 'Sin movimiento',
  ingresos_excesivos: 'Ingresos excesivos',
  saldo_excesivo: 'Saldo excesivo',
  efecto_desaparecido: 'Efecto desaparecido',
  efecto_nuevo: 'Efecto nuevo',
  saldo_negativo: 'Saldo negativo',
  ingreso_sin_consumo: 'Ingreso sin consumo',
  efecto_intempestivo: 'Efecto intempestivo',
};
