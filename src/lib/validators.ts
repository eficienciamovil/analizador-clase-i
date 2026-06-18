import type { EstadoItem } from '../types/estado';
import type { Alerta } from '../types/alertas';
import type { ConfiguracionApp } from '../types/scoring';

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
      p
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
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
  if (item.egresos === 0 && item.saldoQuePasa > 0) {
    return {
      tipo: 'saldo_excesivo',
      severidad: 'media',
      descripcion: `Stock inmovilizado: ${item.saldoQuePasa.toFixed(3)} ${item.umd} sin egresos en el mes.`,
      valorDetectado: item.saldoQuePasa,
      valorEsperado: 'egresos > 0',
      recomendacion:
        'Evaluar si el saldo remanente supera la necesidad normal y si corresponde ajustar pedidos futuros.',
    };
  }

  if (item.egresos > 0) {
    const ratio = item.saldoQuePasa / item.egresos;
    if (ratio >= config.umbralSaldoEgresoRatio) {
      return {
        tipo: 'saldo_excesivo',
        severidad: ratio >= 5 ? 'alta' : 'media',
        descripcion: `Saldo que pasa representa ${ratio.toFixed(1)} veces el egreso mensual.`,
        valorDetectado: ratio,
        valorEsperado: `< ${config.umbralSaldoEgresoRatio}`,
        recomendacion:
          'Evaluar si el saldo remanente supera la necesidad normal del organismo y si corresponde ajustar pedidos futuros.',
      };
    }
  }
  return null;
}
