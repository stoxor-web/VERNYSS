import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Money } from '../components/Money';
import { addUserDocument, listUserDocuments } from '../database/userRepository';

interface PositionView { id: string; envelope: string; name: string; ticker: string; quantity: number; averageCost: number; currentValue: number; realizedGain: number; dividends: number; fees: number; }

export default function InvestmentsPage() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<PositionView[]>([]);
  const [form, setForm] = useState({ envelope: 'PEA', name: '', ticker: '', quantity: '', averageCost: '', currentValue: '', realizedGain: '0', dividends: '0', fees: '0' });
  const [message, setMessage] = useState<string | null>(null);
  const load = async () => {
    if (user === null) return;
    const docs = await listUserDocuments(user.uid, 'investments', 200);
    setPositions(docs.map(({ id, data }) => ({ id, envelope: String(data['envelope'] ?? ''), name: String(data['name'] ?? ''), ticker: String(data['ticker'] ?? ''), quantity: Number(data['quantity'] ?? 0), averageCost: Number(data['averageCost'] ?? 0), currentValue: Number(data['currentValue'] ?? 0), realizedGain: Number(data['realizedGain'] ?? 0), dividends: Number(data['dividends'] ?? 0), fees: Number(data['fees'] ?? 0) })));
  };
  useEffect(() => { void load().catch(() => setMessage('Chargement impossible.')); }, [user]);
  const submit = async () => {
    if (user === null) return;
    const parse = (value: string) => Number(value.replace(',', '.'));
    const values = { quantity: parse(form.quantity), averageCost: parse(form.averageCost), currentValue: parse(form.currentValue), realizedGain: parse(form.realizedGain), dividends: parse(form.dividends), fees: parse(form.fees) };
    if (form.name.trim() === '' || Object.values(values).some((value) => !Number.isFinite(value)) || values.quantity < 0 || values.averageCost < 0 || values.currentValue < 0 || values.dividends < 0 || values.fees < 0) { setMessage('Position invalide.'); return; }
    await addUserDocument(user.uid, 'investments', { envelope: form.envelope, name: form.name.trim(), ticker: form.ticker.trim(), ...values });
    setMessage('Position enregistrée.');
    setForm({ ...form, name: '', ticker: '', quantity: '', averageCost: '', currentValue: '' });
    await load();
  };
  const marketValue = positions.reduce((sum, item) => sum + item.currentValue, 0);
  return <>
    <section className="page-heading"><div><p className="eyebrow">INVESTISSEMENTS</p><h1>PEA & CTO : versements ≠ performance.</h1><p>La fiscalité porte sur les événements réalisés selon les règles applicables ; les plus-values latentes restent distinctes.</p></div></section>
    <section className="split-grid"><article className="panel"><div className="panel-heading"><h2>Ajouter une position</h2></div><div className="form-grid">
      <label>Enveloppe<select value={form.envelope} onChange={(e) => setForm({ ...form, envelope: e.target.value })}><option>PEA</option><option>CTO</option></select></label>
      <label>Nom<input maxLength={160} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>Ticker<input maxLength={32} value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} /></label>
      {(['quantity', 'averageCost', 'currentValue', 'realizedGain', 'dividends', 'fees'] as const).map((key) => <label key={key}>{({ quantity: 'Quantité', averageCost: 'PRU €', currentValue: 'Valeur actuelle €', realizedGain: 'Plus-value réalisée €', dividends: 'Dividendes €', fees: 'Frais €' })[key]}<input inputMode="decimal" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}
    </div><button className="primary" onClick={() => { void submit().catch(() => setMessage('Enregistrement refusé ou indisponible.')); }}>Enregistrer</button>{message ? <p role="status">{message}</p> : null}</article>
    <article className="panel"><div className="panel-heading"><h2>Positions</h2><Money value={marketValue} /></div>{positions.length === 0 ? <p className="muted">Aucune position enregistrée.</p> : <div className="table-wrap"><table><thead><tr><th>Enveloppe</th><th>Titre</th><th>Quantité</th><th>Valeur</th><th>Latent indicatif</th></tr></thead><tbody>{positions.map((p) => { const cost = p.quantity * p.averageCost; const latent = p.currentValue - cost; return <tr key={p.id}><td>{p.envelope}</td><td>{p.name}{p.ticker ? ` · ${p.ticker}` : ''}</td><td>{p.quantity}</td><td><Money value={p.currentValue} /></td><td><Money value={latent} signed /></td></tr>; })}</tbody></table></div>}</article></section>
    <section className="notice">Allocation cible : à construire en tenant compte de la liquidité, de l’horizon, d’un projet immobilier, de la réserve de sécurité, de la dette et du risque — pas uniquement d’un rendement attendu.</section>
  </>;
}
