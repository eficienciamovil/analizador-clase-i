export type EstadoItem = {
  codigo: string;
  descripcion: string;
  descripcionNormalizada: string;
  umd: string;
  saldoMesAnterior: number;
  ingresos: number;
  egresos: number;
  saldoQuePasa: number;
  abastecimientoHasta?: string;
  rubro?: string;
  filaOrigen: number;
};

export type ImportResult = {
  items: EstadoItem[];
  filasDescartadas: FilaDescartada[];
  encabezadoFila: number;
  totalFilas: number;
  nombreArchivo: string;
  periodoDetectado?: string;
  unidadDetectada?: string;
  errores: string[];
  advertencias: string[];
};

export type FilaDescartada = {
  fila: number;
  contenido: string;
  razon: string;
};
