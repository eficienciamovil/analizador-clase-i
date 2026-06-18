import type { SeveridadAlerta } from '../types/alertas';

const CLASSES: Record<SeveridadAlerta, string> = {
  critica: 'badge-critical',
  alta: 'badge-alta',
  media: 'badge-media',
  baja: 'badge-baja',
  informativa: 'badge-informativa',
};

const LABELS: Record<SeveridadAlerta, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
  informativa: 'Informativa',
};

type Props = { severidad: SeveridadAlerta; count?: number };

export function AlertBadge({ severidad, count }: Props) {
  return (
    <span className={CLASSES[severidad]}>
      {LABELS[severidad]}{count !== undefined ? ` (${count})` : ''}
    </span>
  );
}
