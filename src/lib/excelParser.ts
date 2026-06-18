import * as XLSX from 'xlsx';
import type { EstadoItem, ImportResult, FilaDescartada } from '../types/estado';
import {
  esCodigoValido,
  limpiarDescripcion,
  normalizarDescripcion,
  normalizarCodigo,
  normalizarUmd,
  normalizarFecha,
  parsearNumero,
  normalizarNombreColumna,
} from './normalizers';
import { ENCABEZADO_KEYWORDS, NOMBRE_HOJA } from './constants';

type ColMap = {
  codigo: number;
  descripcion: number;
  umd: number;
  saldoMesAnterior: number;
  ingresos: number;
  egresos: number;
  saldoQuePasa: number;
  abastecimientoHasta: number;
};

function detectarEncabezado(rows: unknown[][]): { fila: number; colMap: ColMap } | null {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!row) continue;
    const textos = row.map((c) => normalizarNombreColumna(String(c ?? '')));
    const matchCount = ENCABEZADO_KEYWORDS.filter((kw) =>
      textos.some((t) => t.includes(normalizarNombreColumna(kw)))
    ).length;

    if (matchCount >= 3) {
      const colMap = mapearColumnas(textos);
      if (colMap) return { fila: i, colMap };
    }
  }
  return null;
}

function mapearColumnas(textos: string[]): ColMap | null {
  const find = (keywords: string[]): number => {
    for (const kw of keywords) {
      const idx = textos.findIndex((t) => t.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const codigo = find(['codigo', 'cod']);
  const descripcion = find(['descripcion', 'descripci']);
  const umd = find(['umd', 'unidad']);
  const saldoMesAnterior = find(['saldo mes', 'saldo anterior', 'saldo mes anterior']);
  const ingresos = find(['ingresos', 'ingreso']);
  const egresos = find(['egresos', 'egreso']);
  const saldoQuePasa = find(['saldo que', 'saldo que pasa']);
  const abastecimientoHasta = find(['abastecimiento', 'hasta']);

  if (codigo === -1 || descripcion === -1) return null;

  return {
    codigo,
    descripcion,
    umd: umd !== -1 ? umd : 2,
    saldoMesAnterior: saldoMesAnterior !== -1 ? saldoMesAnterior : 3,
    ingresos: ingresos !== -1 ? ingresos : 4,
    egresos: egresos !== -1 ? egresos : 5,
    saldoQuePasa: saldoQuePasa !== -1 ? saldoQuePasa : 6,
    abastecimientoHasta: abastecimientoHasta !== -1 ? abastecimientoHasta : 7,
  };
}

function extraerRubro(fila: unknown[]): string | null {
  const textos = fila.map((c) => String(c ?? '').trim()).filter(Boolean);
  if (textos.length === 1) return textos[0];
  if (textos.length === 0) return null;
  // Row that has description but no code and no numbers is likely a rubro header
  const tieneNumeros = fila.some((c) => {
    const n = parsearNumero(c);
    return n !== 0;
  });
  if (!tieneNumeros && textos.length <= 2) return textos[0];
  return null;
}

function detectarPeriodo(rows: unknown[][]): string | undefined {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!row) continue;
    for (const cell of row) {
      const str = String(cell ?? '');
      const match = str.match(/(\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{4}|(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+\d{4}|al\s+\d{2}\s+(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\s+\d{2,4})/i);
      if (match) return match[0];
    }
  }
  return undefined;
}

function detectarUnidad(rows: unknown[][]): string | undefined {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!row) continue;
    for (const cell of row) {
      const str = String(cell ?? '');
      const match = str.match(/U\d{4}/);
      if (match) return match[0];
    }
  }
  return undefined;
}

export async function parsearArchivoExcel(archivo: File): Promise<ImportResult> {
  const buffer = await archivo.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });

  const errores: string[] = [];
  const advertencias: string[] = [];

  // Find Est Abast sheet
  const hojaIndex = workbook.SheetNames.findIndex(
    (n) => n.toLowerCase().replace(/\s/g, '') === NOMBRE_HOJA.toLowerCase().replace(/\s/g, '')
  );

  let hoja: XLSX.WorkSheet;
  if (hojaIndex === -1) {
    advertencias.push(
      `No se encontró la hoja "${NOMBRE_HOJA}". Se usará la primera hoja disponible: "${workbook.SheetNames[0]}".`
    );
    hoja = workbook.Sheets[workbook.SheetNames[0]];
  } else {
    hoja = workbook.Sheets[workbook.SheetNames[hojaIndex]];
  }

  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(hoja, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  const periodoDetectado = detectarPeriodo(rawRows);
  const unidadDetectada = detectarUnidad(rawRows);

  const encabezadoDetectado = detectarEncabezado(rawRows);
  if (!encabezadoDetectado) {
    errores.push('No se pudo detectar la fila de encabezados. Verifique el formato del archivo.');
    return {
      items: [],
      filasDescartadas: [],
      encabezadoFila: -1,
      totalFilas: rawRows.length,
      nombreArchivo: archivo.name,
      periodoDetectado,
      unidadDetectada,
      errores,
      advertencias,
    };
  }

  const { fila: encabezadoFila, colMap } = encabezadoDetectado;
  const items: EstadoItem[] = [];
  const filasDescartadas: FilaDescartada[] = [];
  let rubroActual: string | undefined;

  const codigosVistos = new Set<string>();

  for (let i = encabezadoFila + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.every((c) => String(c ?? '').trim() === '')) continue;

    const codigoRaw = row[colMap.codigo];
    const descripcionRaw = row[colMap.descripcion];

    // Check if this is a rubro header row
    if (!esCodigoValido(codigoRaw)) {
      const rubro = extraerRubro(row);
      if (rubro) rubroActual = rubro;
      else {
        filasDescartadas.push({
          fila: i + 1,
          contenido: row.map((c) => String(c ?? '').trim()).join(' | '),
          razon: 'Sin código numérico válido (fila de agrupador o vacía)',
        });
      }
      continue;
    }

    const codigo = normalizarCodigo(codigoRaw);
    const descripcion = limpiarDescripcion(String(descripcionRaw ?? ''));

    if (!descripcion) {
      filasDescartadas.push({
        fila: i + 1,
        contenido: String(codigoRaw),
        razon: 'Descripción vacía',
      });
      continue;
    }

    if (codigosVistos.has(codigo)) {
      advertencias.push(`Código duplicado detectado: ${codigo} (${descripcion}) en fila ${i + 1}.`);
    }
    codigosVistos.add(codigo);

    const saldoMesAnterior = parsearNumero(row[colMap.saldoMesAnterior]);
    const ingresos = parsearNumero(row[colMap.ingresos]);
    const egresos = parsearNumero(row[colMap.egresos]);
    const saldoQuePasa = parsearNumero(row[colMap.saldoQuePasa]);
    const abastecimientoHasta =
      colMap.abastecimientoHasta !== -1
        ? normalizarFecha(row[colMap.abastecimientoHasta])
        : undefined;

    items.push({
      codigo,
      descripcion,
      descripcionNormalizada: normalizarDescripcion(descripcion),
      umd: normalizarUmd(row[colMap.umd]),
      saldoMesAnterior,
      ingresos,
      egresos,
      saldoQuePasa,
      abastecimientoHasta,
      rubro: rubroActual,
      filaOrigen: i + 1,
    });
  }

  return {
    items,
    filasDescartadas,
    encabezadoFila: encabezadoFila + 1,
    totalFilas: rawRows.length,
    nombreArchivo: archivo.name,
    periodoDetectado,
    unidadDetectada,
    errores,
    advertencias,
  };
}
