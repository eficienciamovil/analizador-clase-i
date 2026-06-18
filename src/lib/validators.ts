import type { EstadoItem } from '../types/estado';
import type { Alerta } from '../types/alertas';
import type { ConfiguracionApp } from '../types/scoring';

// Keywords that imply refrigerated storage
const REFRIGERADOS_KEYWORDS = [
  'carne', 'picada', 'pollo', 'jamon', 'jamón', 'queso', 'manteca',
  'ricota', 'leche', 'yogur', 'panceta', 'bondiola', 'cerdo',
  'bife', 'lomo', 'nalga', 'paleta', 'asado', 'vacío', 'vacio',
  'peceto', 'matambre', 'cuadril', 'roast', 'hamburguesa', 'chorizo',
];

export function esRefrigerado(descNorm: string): boolean {
  return REFRIGERADOS_KEYWORDS.some((k) => descNorm.includes(k));
}

// Estimate meses de stock based on ratio saldo/egresos
function mesesDeStock(ratio: number): string {
  if (ratio < 1) return 'menos de 1 mes';
  if (ratio === 1) return '1 mes';
  return `${ratio.toFixed(1)} meses`;
}

export function validarSaldoNegativo(item: EstadoItem): Alerta | null {
  if (item.saldoQuePasa < -0.001) {
    return {
      tipo: 'saldo_negativo',
      severidad: 'critica',
      descripcion: `Saldo que pasa negativo: ${item.saldoQuePasa.toFixed(3)} ${item.umd}`,
      valorDetectado: item.saldoQuePasa,
      valorEsperado: '≥ 0',
      recomendacion:
        'Revisar con prioridad. Un saldo negativo indica inconsistencia aritmética o de registración. Verificar ingresos, egresos y saldo inicial.',
    };
  }
  return null;
}

export function validarConsumoInmediato(
  item: EstadoItem,
  config: ConfiguracionApp
): Alerta | null {
  const descNorm = item.descripcionNormalizada;
  const esConsumoInmediato = config.productosConsumoInmediato.some((p) =>
    descNorm.includes(
      p.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    )
  );

  if (esConsumoInmediato && Math.abs(item.saldoQuePasa) > 0.001) {
    return {
      tipo: 'consumo_inmediato_con_saldo',
      severidad: 'alta',
      descripcion: `Efecto de consumo inmediato con saldo que pasa: ${item.saldoQuePasa.toFixed(3)} ${item.umd}`,
      valorDetectado: item.saldoQuePasa,
      valorEsperado: 0,
      recomendacion:
        'Verificar existencia física, egreso diario o error de imputación, por tratarse de efecto de consumo inmediato.',
    };
  }
  return null;
}

export function validarSinMovimiento(item: EstadoItem): Alerta | null {
  if (item.egresos === 0) {
    const severidad = item.saldoQuePasa > 10000 ? 'alta' : 'media';
    return {
      tipo: 'sin_movimiento',
      severidad,
      descripcion: `Sin egresos registrados durante el mes. Saldo que pasa: ${item.saldoQuePasa.toFixed(3)} ${item.umd}`,
      valorDetectado: item.egresos,
      valorEsperado: '> 0',
      recomendacion:
        'Verificar si el efecto permanece inmovilizado, si no fue consumido por falta de demanda o si existen egresos no registrados.',
    };
  }
  return null;
}

export function validarIngresosExcesivos(
  item: EstadoItem,
  config: ConfiguracionApp
): Alerta | null {
  if (item.ingresos === 0) return null;

  if (item.egresos === 0) {
    return {
      tipo: 'ingreso_sin_consumo',
      severidad: 'alta',
      descripcion: `Ingreso registrado (${item.ingresos.toFixed(3)} ${item.umd}) sin consumo durante el mes.`,
      valorDetectado: item.ingresos,
      valorEsperado: 'egresos > 0',
      recomendacion:
        'Contrastar el ingreso con el consumo real, raciones servidas y nivel de stock disponible.',
    };
  }

  const ratio = item.ingresos / item.egresos;
  if (ratio >= config.umbralIngresoEgresoRatio) {
    return {
      tipo: 'ingresos_excesivos',
      severidad: ratio >= 3 ? 'alta' : 'media',
      descripcion: `Los ingresos superan ${((ratio - 1) * 100).toFixed(0)}% a los egresos. Ratio: ${ratio.toFixed(2)}`,
      valorDetectado: ratio,
      valorEsperado: `< ${config.umbralIngresoEgresoRatio}`,
      recomendacion:
        'Contrastar el ingreso mensual con el consumo real, raciones servidas, nivel de stock disponible y criterio de pedido.',
    };
  }
  return null;
}

export function validarSaldoExcesivo(
  item: EstadoItem,
  config: ConfiguracionApp
): Alerta | null {
  const refrigerado = esRefrigerado(item.descripcionNormalizada);

  // Case 1: no consumption at all
  if (item.egresos === 0 && item.saldoQuePasa > 0) {
    const msg = refrigerado
      ? `Stock inmovilizado de producto REFRIGERADO: ${item.saldoQuePasa.toFixed(3)} ${item.umd} sin egresos. Requiere verificación urgente de capacidad frigorífica.`
      : `Stock inmovilizado: ${item.saldoQuePasa.toFixed(3)} ${item.umd} sin egresos en el mes.`;
    return {
      tipo: 'saldo_excesivo',
      severidad: refrigerado ? 'alta' : 'media',
      descripcion: msg,
      valorDetectado: item.saldoQuePasa,
      valorEsperado: 'egresos > 0',
      recomendacion: refrigerado
        ? `Verificar capacidad de almacenamiento frigorífico disponible para ${item.saldoQuePasa.toFixed(3)} ${item.umd}. Evaluar condición del producto y posible vencimiento.`
        : 'Evaluar si el saldo remanente supera la necesidad normal y si corresponde ajustar pedidos futuros.',
    };
  }

  // Case 2: some consumption but very low relative to stock
  if (item.egresos > 0) {
    const ratio = item.saldoQuePasa / item.egresos;
    if (ratio >= config.umbralSaldoEgresoRatio) {
      // Severity escalation: > 6 months = alta, > 12 months = critica
      const severidad = ratio >= 12 ? 'critica' : ratio >= 6 ? 'alta' : 'media';

      const capacidadMsg = refrigerado
        ? ` PRODUCTO REFRIGERADO: verificar si existe capacidad frigorífica para almacenar ${item.saldoQuePasa.toFixed(3)} ${item.umd}.`
        : '';

      return {
        tipo: 'saldo_excesivo',
        severidad,
        descripcion:
          `Saldo equivale a ${mesesDeStock(ratio)} de consumo al ritmo actual ` +
          `(saldo: ${item.saldoQuePasa.toFixed(3)} ${item.umd} / egreso mensual: ${item.egresos.toFixed(3)} ${item.umd}).` +
          capacidadMsg,
        valorDetectado: ratio,
        valorEsperado: `< ${config.umbralSaldoEgresoRatio} meses`,
        recomendacion: refrigerado
          ? `Verificar urgentemente dónde y cómo se almacenan ${item.saldoQuePasa.toFixed(3)} ${item.umd}. Controlar capacidad frigorífica, condición del producto y fecha de vencimiento. Evaluar ajuste de pedidos.`
          : 'Evaluar si el saldo remanente supera la necesidad normal del organismo. Verificar lugar de almacenamiento, capacidad disponible y ajustar pedidos futuros.',
      };
    }
  }
  return null;
}
