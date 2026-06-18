export type SeveridadAlerta = 'critica' | 'alta' | 'media' | 'baja' | 'informativa';

export type TipoAlerta =
  | 'arrastre_saldo'
  | 'consumo_inmediato_con_saldo'
  | 'sin_movimiento'
  | 'ingresos_excesivos'
  | 'saldo_excesivo'
  | 'efecto_desaparecido'
  | 'efecto_nuevo'
  | 'saldo_negativo'
  | 'ingreso_sin_consumo'
  | 'efecto_intempestivo';

export type Alerta = {
  tipo: TipoAlerta;
  severidad: SeveridadAlerta;
  descripcion: string;
  valorDetectado?: number | string;
  valorEsperado?: number | string;
  recomendacion: string;
};

export type ComparacionItem = {
  codigo: string;
  descripcion: string;
  umd: string;
  rubro?: string;
  itemMesAnterior?: import('./estado').EstadoItem;
  itemMesPosterior?: import('./estado').EstadoItem;
  estadoComparativo: 'presente_en_ambos' | 'solo_mes_anterior' | 'solo_mes_posterior';
  alertas: Alerta[];
  severidadMaxima?: SeveridadAlerta;
  // Métricas calculadas
  diferencia_arrastre?: number;
  ratio_ingreso_egreso?: number;
  ratio_saldo_egreso?: number;
};

export type ResumenAlertas = {
  criticas: number;
  altas: number;
  medias: number;
  bajas: number;
  informativas: number;
  total: number;
};
