import type { ComparacionItem } from '../types/alertas';
import type { ResultadoScoring, ConfiguracionApp } from '../types/scoring';

export function calcularScoring(
  items: ComparacionItem[],
  config: ConfiguracionApp
): ResultadoScoring {
  let criticas = 0, altas = 0, medias = 0, bajas = 0, informativas = 0;

  for (const item of items) {
    for (const alerta of item.alertas) {
      switch (alerta.severidad) {
        case 'critica': criticas++; break;
        case 'alta': altas++; break;
        case 'media': medias++; break;
        case 'baja': bajas++; break;
        case 'informativa': informativas++; break;
      }
    }
  }

  const penalizacionCriticas = criticas * config.penalizaciones.critica;
  const penalizacionAltas = altas * config.penalizaciones.alta;
  const penalizacionMedias = medias * config.penalizaciones.media;
  const penalizacionBajas = bajas * config.penalizaciones.baja;
  const penalizacionInformativas = informativas * config.penalizaciones.informativa;
  const totalPenalizacion =
    penalizacionCriticas + penalizacionAltas + penalizacionMedias + penalizacionBajas + penalizacionInformativas;

  const puntaje = Math.max(0, 100 - totalPenalizacion);

  let clasificacion: ResultadoScoring['clasificacion'];
  let etiqueta: string;
  let color: string;

  if (puntaje >= 90) {
    clasificacion = 'consistente';
    etiqueta = 'Estado consistente';
    color = '#16a34a';
  } else if (puntaje >= 75) {
    clasificacion = 'aceptable';
    etiqueta = 'Estado aceptable con observaciones';
    color = '#65a30d';
  } else if (puntaje >= 60) {
    clasificacion = 'inconsistencias_relevantes';
    etiqueta = 'Estado con inconsistencias relevantes';
    color = '#d97706';
  } else if (puntaje >= 40) {
    clasificacion = 'deficiente';
    etiqueta = 'Estado deficiente';
    color = '#dc2626';
  } else {
    clasificacion = 'critico';
    etiqueta = 'Estado crítico';
    color = '#7f1d1d';
  }

  return {
    puntaje,
    clasificacion,
    etiqueta,
    color,
    detalle: {
      penalizacionCriticas,
      penalizacionAltas,
      penalizacionMedias,
      penalizacionBajas,
      penalizacionInformativas,
      totalPenalizacion,
    },
  };
}
