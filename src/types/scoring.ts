export type ClasificacionEstado =
  | 'consistente'
  | 'aceptable'
  | 'inconsistencias_relevantes'
  | 'deficiente'
  | 'critico';

export type ResultadoScoring = {
  puntaje: number;
  clasificacion: ClasificacionEstado;
  etiqueta: string;
  color: string;
  detalle: {
    penalizacionCriticas: number;
    penalizacionAltas: number;
    penalizacionMedias: number;
    penalizacionBajas: number;
    penalizacionInformativas: number;
    totalPenalizacion: number;
  };
};

export type ConfiguracionApp = {
  toleranciaDecimal: number;
  umbralIngresoEgresoRatio: number;
  umbralSaldoEgresoRatio: number;
  productosConsumoInmediato: string[];
  productosParaPlanB: string[];
  penalizaciones: {
    critica: number;
    alta: number;
    media: number;
    baja: number;
    informativa: number;
  };
};
