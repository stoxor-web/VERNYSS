import { useMemo, useState } from 'react';
import { Money } from '../components/Money';
import { StatusPill } from '../components/StatusPill';
import { DECLARATION_FORMS, DECLARATION_HELP, DECLARATION_WARNING } from '../tax/declarationHelp';
import { TaxEngine } from '../tax/TaxEngine';
import { ruleFreshness, TAX_RULES_2026 } from '../tax/rules';

export default function TaxPage() {
  const engine = useMemo(() => new TaxEngine(), []);
  const [form, setForm] = useState({ dividends: '0', other: '0', gains: '0', tmi: '30' });
  const [lossForm, setLossForm] = useState({ gain: '0', loss: '0', originYear: String(new Date().getFullYear() - 1) });
  const [optionResult, setOptionResult] = useState<ReturnType<TaxEngine['pfuVsProgressive']> | null>(null);
  const [ctoResult, setCtoResult] = useState<ReturnType<TaxEngine['ctoPfuEstimate']> | null>(null);
  const parse = (value: string) => Number(value.replace(',', '.'));
  const runOption = () => setOptionResult(engine.pfuVsProgressive({ eligibleDividends: parse(form.dividends), otherInvestmentIncome: parse(form.other), realizedCapitalGains: parse(form.gains), indicativeMarginalRate: parse(form.tmi) / 100 }));
  const runCto = () => {
    const originYear = Number(lossForm.originYear);
    const loss = parse(lossForm.loss);
    setCtoResult(engine.ctoPfuEstimate(parse(lossForm.gain), [{ originYear, initialAmount: loss, usedAmount: 0, remainingAmount: loss, expiresYear: originYear + TAX_RULES_2026.capitalLossCarryForwardYears.value }], new Date().getFullYear()));
  };
  const rules = Object.values(TAX_RULES_2026);
  return <>
    <section className="page-heading"><div><p className="eyebrow">FISCALITÉ FRANÇAISE</p><h1>Moteur versionné, sourcé et prudent.</h1><p>Les simulations n’essaient pas de reconstruire l’impôt complet du foyer. Une règle non vérifiée reste « À confirmer ».</p></div></section>
    <section className="panel"><div className="panel-heading"><h2>Règles actives</h2><span className="muted">Vérifiées le 31/08/2026</span></div><div className="table-wrap"><table><thead><tr><th>Règle</th><th>Version</th><th>Valeur</th><th>Fraîcheur</th><th>Source</th></tr></thead><tbody>{rules.map((rule) => { const freshness = ruleFreshness(rule); return <tr key={rule.id}><td>{rule.scope}</td><td>{rule.ruleVersion}</td><td>{typeof rule.value === 'number' && rule.value < 1 ? `${(rule.value * 100).toLocaleString('fr-FR')} %` : String(rule.value)}</td><td><StatusPill tone={freshness === 'fresh' ? 'ok' : freshness === 'warning' ? 'warning' : 'danger'}>{freshness}</StatusPill></td><td><a href={rule.sourceUrl} target="_blank" rel="noreferrer">{rule.sourceTitle}</a></td></tr>; })}</tbody></table></div></section>
    <section className="split-grid"><article className="panel"><div className="panel-heading"><h2>PFU vs barème</h2><span className="badge">SIMULATION SIMPLIFIÉE</span></div><div className="form-grid">
      <label>Dividendes éligibles €<input inputMode="decimal" value={form.dividends} onChange={(e) => setForm({ ...form, dividends: e.target.value })} /></label><label>Autres revenus mobiliers €<input inputMode="decimal" value={form.other} onChange={(e) => setForm({ ...form, other: e.target.value })} /></label><label>Plus-values réalisées €<input inputMode="decimal" value={form.gains} onChange={(e) => setForm({ ...form, gains: e.target.value })} /></label><label>TMI indicative %<input inputMode="decimal" value={form.tmi} onChange={(e) => setForm({ ...form, tmi: e.target.value })} /></label>
    </div><button className="primary" onClick={() => { try { runOption(); } catch { setOptionResult(null); } }}>Comparer</button>{optionResult ? <div className="result-stack"><div className="ledger-row"><span>PFU indicatif</span><Money value={optionResult.pfu} /></div><div className="ledger-row"><span>Barème indicatif</span><Money value={optionResult.progressiveScaleIndicative} /></div><p>Option arithmétiquement plus basse dans cette simplification : <strong>{optionResult.lowerIndicativeOption}</strong>.</p><p className="fine-print">{optionResult.warnings.join(' ')}</p></div> : null}</article>
      <article className="panel"><div className="panel-heading"><h2>CTO & report de moins-value</h2></div><div className="form-grid"><label>Gain réalisé €<input inputMode="decimal" value={lossForm.gain} onChange={(e) => setLossForm({ ...lossForm, gain: e.target.value })} /></label><label>Report disponible €<input inputMode="decimal" value={lossForm.loss} onChange={(e) => setLossForm({ ...lossForm, loss: e.target.value })} /></label><label>Année d’origine<input inputMode="numeric" value={lossForm.originYear} onChange={(e) => setLossForm({ ...lossForm, originYear: e.target.value })} /></label></div><button className="primary" onClick={() => { try { runCto(); } catch { setCtoResult(null); } }}>Simuler</button>{ctoResult ? <div className="result-stack"><div className="ledger-row"><span>Gain imposable indicatif</span><Money value={ctoResult.taxableRealizedGain} /></div><div className="ledger-row"><span>Estimation PFU</span><Money value={ctoResult.totalEstimate} /></div><p className="fine-print">Plus-values latentes exclues. {ctoResult.warnings.join(' ')}</p></div> : null}</article></section>
    <section className="panel"><div className="panel-heading"><h2>Assistant déclaration</h2><span className="muted">Repères, pas télédéclaration</span></div><div className="table-wrap"><table><thead><tr><th>Case</th><th>Repère</th><th>Contrôle</th></tr></thead><tbody>{DECLARATION_HELP.map((row) => <tr key={row.code}><td><strong>{row.code}</strong></td><td>{row.label}</td><td>{row.note}</td></tr>)}</tbody></table></div><p>{DECLARATION_WARNING}</p><p className="muted">Formulaires possibles : {DECLARATION_FORMS.join(' · ')}.</p></section>
  </>;
}
