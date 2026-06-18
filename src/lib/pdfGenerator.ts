import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComparacionItem, ResumenAlertas } from '../types/alertas';
import type { ResultadoScoring } from '../types/scoring';
import type { ImportResult } from '../types/estado';
import { TIPO_ALERTA_LABELS } from './constants';

function fmt(n?: number): string {
  if (n === undefined || n === null) return '-';
  return n.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function fmtRatio(n?: number): string {
  if (n === undefined || n === null) return '-';
  return n.toFixed(2);
}

export function generarPDF(
  items: ComparacionItem[],
  resumen: ResumenAlertas,
  scoring: ResultadoScoring,
  importAnterior: ImportResult,
  importPosterior: ImportResult
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;
  const now = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const addHeader = () => {
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('EJÉRCITO ARGENTINO — DIRECCIÓN GENERAL DE INTENDENCIA', margin, 7);
    doc.text('Analizador de Estados de Abastecimiento Clase I', margin, 13);
    doc.text(now, pageW - margin, 13, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  // ── PAGE 1: Cover ──────────────────────────────────────────
  addHeader();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Informe de Análisis Comparativo', pageW / 2, 40, { align: 'center' });
  doc.text('Estados de Abastecimiento Clase I', pageW / 2, 50, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const unidad = importAnterior.unidadDetectada ?? importPosterior.unidadDetectada ?? 'N/D';
  const periodoAnt = importAnterior.periodoDetectado ?? 'Mes anterior';
  const periodoPost = importPosterior.periodoDetectado ?? 'Mes posterior';

  const infoLines = [
    ['Unidad analizada:', unidad],
    ['Período anterior:', periodoAnt],
    ['Período posterior:', periodoPost],
    ['Archivo mes anterior:', importAnterior.nombreArchivo],
    ['Archivo mes posterior:', importPosterior.nombreArchivo],
    ['Fecha de generación:', now],
  ];

  let y = 70;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y - 5, contentW, infoLines.length * 9 + 8, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y - 5, contentW, infoLines.length * 9 + 8, 3, 3, 'S');

  for (const [label, value] of infoLines) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(label, margin + 4, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(String(value), margin + 50, y + 1);
    y += 9;
  }

  // Scoring box
  y += 10;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentW, 35, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentW, 35, 3, 3, 'S');

  const scoreColor = scoring.color;
  const [r, g, b] = scoreColor.match(/\d+/g)!.slice(0, 3).map(Number);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(r, g, b);
  doc.text(`${scoring.puntaje.toFixed(1)}`, margin + 8, y + 22);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('/ 100', margin + 28, y + 22);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(r, g, b);
  doc.text(scoring.etiqueta, margin + 50, y + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Indicador técnico preliminar parametrizable. No reemplaza el criterio profesional.',
    margin + 50, y + 27
  );

  y += 45;

  // Alert summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Resumen de alertas', margin, y);
  y += 6;

  const alertData = [
    ['Críticas', String(resumen.criticas), '#dc2626'],
    ['Altas', String(resumen.altas), '#ea580c'],
    ['Medias', String(resumen.medias), '#d97706'],
    ['Bajas', String(resumen.bajas), '#2563eb'],
    ['Informativas', String(resumen.informativas), '#64748b'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Severidad', 'Cantidad']],
    body: alertData.map(([s, n]) => [s, n]),
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 30, halign: 'center' } },
    tableWidth: 80,
    theme: 'striped',
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Methodology
  doc.addPage();
  addHeader();
  y = 28;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Metodología', margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const metodologia = [
    'El análisis compara los Estados de Abastecimiento de dos meses consecutivos aplicando los',
    'siguientes controles automáticos:',
    '',
    '1. Arrastre de saldos: verifica que el saldo que pasa del mes anterior coincida con el saldo',
    '   inicial del mes posterior.',
    '2. Consumo inmediato: detecta efectos de consumo inmediato (pan, pizza, etc.) con saldo remanente.',
    '3. Sin movimiento: identifica efectos sin egresos durante el período.',
    '4. Ingresos excesivos: detecta cuando los ingresos superan significativamente los egresos.',
    '5. Saldo excesivo: identifica stocks inmovilizados o sobredimensionados.',
    '6. Continuidad: detecta efectos que aparecen o desaparecen entre meses.',
    '7. Saldos negativos: detecta inconsistencias aritméticas.',
  ];
  for (const line of metodologia) {
    doc.text(line, margin, y);
    y += 5;
  }

  y += 5;

  // Critical alerts table
  const criticas = items.filter((i) => i.alertas.some((a) => a.severidad === 'critica'));
  if (criticas.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(`Alertas Críticas (${criticas.length})`, margin, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Código', 'Descripción', 'Tipo', 'Detalle']],
      body: criticas.flatMap((item) =>
        item.alertas
          .filter((a) => a.severidad === 'critica')
          .map((a) => [
            item.codigo,
            item.descripcion.substring(0, 35),
            TIPO_ALERTA_LABELS[a.tipo] ?? a.tipo,
            a.descripcion.substring(0, 60),
          ])
      ),
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold' },
      theme: 'striped',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // High alerts
  const altas = items.filter((i) => i.alertas.some((a) => a.severidad === 'alta'));
  if (altas.length > 0) {
    if (y > 240) { doc.addPage(); addHeader(); y = 28; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(194, 65, 12);
    doc.text(`Alertas Altas (${altas.length})`, margin, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Código', 'Descripción', 'Tipo', 'Detalle']],
      body: altas.flatMap((item) =>
        item.alertas
          .filter((a) => a.severidad === 'alta')
          .map((a) => [
            item.codigo,
            item.descripcion.substring(0, 35),
            TIPO_ALERTA_LABELS[a.tipo] ?? a.tipo,
            a.descripcion.substring(0, 60),
          ])
      ),
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [194, 65, 12], textColor: 255, fontStyle: 'bold' },
      theme: 'striped',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Top 10 ingresos excesivos
  doc.addPage();
  addHeader();
  y = 28;

  const conRatio = items
    .filter((i) => i.ratio_ingreso_egreso !== undefined)
    .sort((a, b) => (b.ratio_ingreso_egreso ?? 0) - (a.ratio_ingreso_egreso ?? 0))
    .slice(0, 10);

  if (conRatio.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Top 10 — Mayor ratio ingreso/egreso', margin, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Código', 'Descripción', 'Umd', 'Ingresos', 'Egresos', 'Ratio']],
      body: conRatio.map((i) => [
        i.codigo,
        i.descripcion.substring(0, 30),
        i.umd,
        fmt(i.itemMesPosterior?.ingresos),
        fmt(i.itemMesPosterior?.egresos),
        fmtRatio(i.ratio_ingreso_egreso),
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      theme: 'striped',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Top 10 saldos excesivos
  const conSaldo = items
    .filter((i) => (i.itemMesPosterior?.saldoQuePasa ?? 0) > 0)
    .sort((a, b) => (b.itemMesPosterior?.saldoQuePasa ?? 0) - (a.itemMesPosterior?.saldoQuePasa ?? 0))
    .slice(0, 10);

  if (conSaldo.length > 0) {
    if (y > 220) { doc.addPage(); addHeader(); y = 28; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Top 10 — Mayor saldo que pasa', margin, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Código', 'Descripción', 'Umd', 'Saldo ant.', 'Ingresos', 'Egresos', 'Saldo pasa']],
      body: conSaldo.map((i) => [
        i.codigo,
        i.descripcion.substring(0, 28),
        i.umd,
        fmt(i.itemMesPosterior?.saldoMesAnterior),
        fmt(i.itemMesPosterior?.ingresos),
        fmt(i.itemMesPosterior?.egresos),
        fmt(i.itemMesPosterior?.saldoQuePasa),
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      theme: 'striped',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Sin movimiento
  const sinMov = items.filter((i) =>
    i.alertas.some((a) => a.tipo === 'sin_movimiento') && i.itemMesPosterior
  );

  if (sinMov.length > 0) {
    if (y > 220) { doc.addPage(); addHeader(); y = 28; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Efectos sin movimiento (${sinMov.length})`, margin, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Código', 'Descripción', 'Umd', 'Saldo que pasa']],
      body: sinMov.map((i) => [
        i.codigo,
        i.descripcion.substring(0, 40),
        i.umd,
        fmt(i.itemMesPosterior?.saldoQuePasa),
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      theme: 'striped',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Conclusion
  doc.addPage();
  addHeader();
  y = 28;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Conclusión', margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const conclusion = doc.splitTextToSize(
    'El análisis efectuado permite advertir inconsistencias que requieren revisión por parte del organismo ' +
    'responsable, especialmente en materia de continuidad de saldos, razonabilidad de ingresos frente a ' +
    'egresos y permanencia de efectos sin movimiento. La herramienta constituye un mecanismo de asistencia ' +
    'para la fiscalización logística y permite orientar controles posteriores sobre los efectos que presentan ' +
    'mayor nivel de desvío.\n\n' +
    'La calificación asignada no reemplaza el criterio profesional ni la intervención del responsable ' +
    'logístico. Constituye un indicador técnico preliminar basado en reglas objetivas de consistencia, ' +
    'continuidad, razonabilidad de consumos y detección de desvíos.',
    contentW
  );
  doc.text(conclusion, margin, y);
  y += conclusion.length * 5 + 10;

  // Disclaimer box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentW, 22, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  const disclaimer = doc.splitTextToSize(
    'Este informe fue generado automáticamente por el Analizador de Estados de Abastecimiento Clase I. ' +
    'Los hallazgos presentados son de carácter preliminar y deben ser validados por personal competente antes ' +
    'de tomar acciones administrativas o logísticas.',
    contentW - 8
  );
  doc.text(disclaimer, margin + 4, y + 6);

  // Save
  const fileName = `Informe_Clase_I_${importAnterior.periodoDetectado ?? 'ant'}_${importPosterior.periodoDetectado ?? 'post'}.pdf`
    .replace(/[/\\:*?"<>|]/g, '_');
  doc.save(fileName);
}
