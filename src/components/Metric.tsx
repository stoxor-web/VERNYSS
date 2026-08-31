import type { ReactNode } from 'react';

export function Metric({ label, children, note }: { label: string; children: ReactNode; note?: string }) {
  return <div className="metric">
    <span className="metric-label">{label}</span>
    <strong className="metric-value">{children}</strong>
    {note ? <span className="metric-note">{note}</span> : null}
  </div>;
}
