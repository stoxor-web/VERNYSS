import { usePrivacy } from '../privacy/PrivacyContext';

const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function Money({ value, signed = false }: { value: number | null | undefined; signed?: boolean }) {
  const { hideAmounts } = usePrivacy();
  if (value === null || value === undefined || !Number.isFinite(value)) return <span className="muted">—</span>;
  if (hideAmounts) return <span className="money masked" aria-label="Montant masqué">•• ••• €</span>;
  const prefix = signed && value > 0 ? '+' : '';
  return <span className="money">{prefix}{formatter.format(value)}</span>;
}
