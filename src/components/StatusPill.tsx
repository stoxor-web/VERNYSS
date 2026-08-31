export function StatusPill({ tone, children }: { tone: 'ok' | 'warning' | 'danger' | 'neutral'; children: string }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}
