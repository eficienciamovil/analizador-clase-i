export function limpiarDescripcion(desc: string): string {
  if (!desc) return '';
  return desc
    .replace(/\.{2,}/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\(PM\)|\(PI\)/gi, '')
    .trim();
}

export function normalizarDescripcion(desc: string): string {
  return limpiarDescripcion(desc)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

export function parsearNumero(valor: unknown): number {
  if (valor === null || valor === undefined || valor === '') return 0;
  if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;
  const str = String(valor).trim().replace(/\s/g, '');
  // Handle Argentine/European number format with comma as decimal separator
  // e.g. "1.234,56" -> 1234.56 or "1,234.56" -> 1234.56
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(str)) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
  }
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(str)) {
    return parseFloat(str.replace(/,/g, ''));
  }
  // Simple comma decimal
  if (/^\d+,\d+$/.test(str)) {
    return parseFloat(str.replace(',', '.'));
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

export function normalizarCodigo(codigo: unknown): string {
  if (!codigo) return '';
  return String(codigo).trim();
}

export function esCodigoValido(codigo: unknown): boolean {
  if (!codigo) return false;
  const str = String(codigo).trim();
  if (str === '') return false;
  // Code must be a number (possibly with leading zeros)
  return /^\d+$/.test(str);
}

export function normalizarUmd(umd: unknown): string {
  if (!umd) return '';
  return String(umd).trim();
}

export function normalizarFecha(valor: unknown): string {
  if (!valor) return '';
  if (typeof valor === 'number') {
    // Excel date serial number
    const date = new Date(Math.round((valor - 25569) * 86400 * 1000));
    return date.toLocaleDateString('es-AR');
  }
  return String(valor).trim();
}

export function normalizarNombreColumna(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
