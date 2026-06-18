import type { EstadoItem } from '../types/estado';
import type { ComparacionItem, Alerta, SeveridadAlerta } from '../types/alertas';
import type { ConfiguracionApp } from '../types/scoring';
import { SEVERIDAD_ORDEN } from './constants';
import {
  validarSaldoNegativo,
  validarConsumoInmediato,
  validarSinMovimiento,
  validarIngresosExcesivos,
  validarSaldoExcesivo,
} from './validators';

function severidadMaxima(alertas: Alerta[]): SeveridadAlerta | undefined {
  if (alertas.length === 0) return undefined;
  return alertas.reduce((max, a) =>
    SEVERIDAD_ORDEN[a.severidad] > SEVERIDAD_ORDEN[max.severidad] ? a : max
  ).severidad;
}

function validarArrastreSaldo(
  anterior: EstadoItem,
  posterior: EstadoItem,
  tolerancia: number
): Alerta | null {
  const diff = Math.abs(anterior.saldoQuePasa - posterior.saldoMesAnterior);
  if (diff > tolerancia) {
    return {
      tipo: 'arrastre_saldo',
      severidad: diff > 1 ? 'critica' : 'alta',
      descripcion: `Diferencia de arrastre: saldo que pasa del mes anterior (${anterior.saldoQuePasa.toFixed(3)}) no coincide con saldo inicial del mes posterior (${posterior.saldoMesAnterior.toFixed(3)}). Diferencia: ${diff.toFixed(3)} ${anterior.umd}`,
      valorDetectado: anterior.saldoQuePasa,
      valorEsperado: posterior.saldoMesAnterior,
      recomendacion:
        'Verificar si el saldo que pasa del mes anterior fue correctamente trasladado como saldo inicial del mes posterior.',
    };
  }
  return null;
}

function validarEfectoNuevo(item: EstadoItem): Alerta | null {
  // Plan B control 4: intempestive appearance
  if (item.saldoMesAnterior > 0 && item.ingresos === 0 && item.saldoQuePasa > 0) {
    return {
      tipo: 'efecto_intempestivo',
      severidad: 'critica',
      descripcion: `Efecto aparece con saldo inicial positivo (${item.saldoMesAnterior.toFixed(3)}) sin ingresos registrados.`,
      valorDetectado: item.saldoMesAnterior,
      valorEsperado: 'Ingresos > 0 o saldo inicial = 0',
      recomendacion:
        'Verificar alta, incorporación, cambio de código o ingreso extraordinario no registrado.',
    };
  }
  return null;
}

export function compararEstados(
  itemsAnterior: EstadoItem[],
  itemsPosterior: EstadoItem[],
  config: ConfiguracionApp
): ComparacionItem[] {
  const mapAnterior = new Map(itemsAnterior.map((i) => [i.codigo, i]));
  const mapPosterior = new Map(itemsPosterior.map((i) => [i.codigo, i]));

  const todosLosCodigos = new Set([
    ...itemsAnterior.map((i) => i.codigo),
    ...itemsPosterior.map((i) => i.codigo),
  ]);

  const resultados: ComparacionItem[] = [];

  for (const codigo of todosLosCodigos) {
    const anterior = mapAnterior.get(codigo);
    const posterior = mapPosterior.get(codigo);
    const alertas: Alerta[] = [];

    let estadoComparativo: ComparacionItem['estadoComparativo'];
    let descripcion = '';
    let umd = '';
    let rubro: string | undefined;

    if (anterior && posterior) {
      estadoComparativo = 'presente_en_ambos';
      descripcion = posterior.descripcion;
      umd = posterior.umd;
      rubro = posterior.rubro ?? anterior.rubro;

      // Control 1: Arrastre de saldo
      const alertaArrastre = validarArrastreSaldo(anterior, posterior, config.toleranciaDecimal);
      if (alertaArrastre) alertas.push(alertaArrastre);

      // Controls on the posterior month's data
      const alertaNegativo = validarSaldoNegativo(posterior);
      if (alertaNegativo) alertas.push(alertaNegativo);

      const alertaConsumo = validarConsumoInmediato(posterior, config);
      if (alertaConsumo) alertas.push(alertaConsumo);

      const alertaMovimiento = validarSinMovimiento(posterior);
      if (alertaMovimiento) alertas.push(alertaMovimiento);

      const alertaIngresos = validarIngresosExcesivos(posterior, config);
      if (alertaIngresos) alertas.push(alertaIngresos);

      const alertaSaldo = validarSaldoExcesivo(posterior, config);
      if (alertaSaldo) alertas.push(alertaSaldo);

    } else if (anterior && !posterior) {
      estadoComparativo = 'solo_mes_anterior';
      descripcion = anterior.descripcion;
      umd = anterior.umd;
      rubro = anterior.rubro;
      alertas.push({
        tipo: 'efecto_desaparecido',
        severidad: 'media',
        descripcion: `El efecto no aparece en el mes posterior.`,
        recomendacion:
          'Verificar baja, reclasificación, consumo total o ausencia indebida en el Estado posterior.',
      });
    } else if (!anterior && posterior) {
      estadoComparativo = 'solo_mes_posterior';
      descripcion = posterior.descripcion;
      umd = posterior.umd;
      rubro = posterior.rubro;
      alertas.push({
        tipo: 'efecto_nuevo',
        severidad: 'baja',
        descripcion: `El efecto no figuraba en el mes anterior.`,
        recomendacion:
          'Verificar alta, incorporación, cambio de código o ingreso extraordinario.',
      });

      // Check for intempestive appearance
      const alertaIntempestiva = validarEfectoNuevo(posterior);
      if (alertaIntempestiva) alertas.push(alertaIntempestiva);
    } else {
      continue;
    }

    const ratio_ingreso_egreso =
      posterior && posterior.egresos > 0
        ? posterior.ingresos / posterior.egresos
        : undefined;

    const ratio_saldo_egreso =
      posterior && posterior.egresos > 0
        ? posterior.saldoQuePasa / posterior.egresos
        : undefined;

    const diferencia_arrastre =
      anterior && posterior
        ? anterior.saldoQuePasa - posterior.saldoMesAnterior
        : undefined;

    resultados.push({
      codigo,
      descripcion,
      umd,
      rubro,
      itemMesAnterior: anterior,
      itemMesPosterior: posterior,
      estadoComparativo,
      alertas,
      severidadMaxima: severidadMaxima(alertas),
      diferencia_arrastre,
      ratio_ingreso_egreso,
      ratio_saldo_egreso,
    });
  }

  // Sort: items with critical alerts first
  resultados.sort((a, b) => {
    const sa = SEVERIDAD_ORDEN[a.severidadMaxima ?? 'informativa'] ?? 0;
    const sb = SEVERIDAD_ORDEN[b.severidadMaxima ?? 'informativa'] ?? 0;
    return sb - sa;
  });

  return resultados;
}

export function calcularResumenAlertas(items: ComparacionItem[]) {
  const resumen = { criticas: 0, altas: 0, medias: 0, bajas: 0, informativas: 0, total: 0 };
  for (const item of items) {
    for (const alerta of item.alertas) {
      resumen[alerta.severidad === 'critica' ? 'criticas'
        : alerta.severidad === 'alta' ? 'altas'
        : alerta.severidad === 'media' ? 'medias'
        : alerta.severidad === 'baja' ? 'bajas'
        : 'informativas']++;
      resumen.total++;
    }
  }
  return resumen;
}
