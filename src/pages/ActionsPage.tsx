import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { RuleBasedAdvisor } from '../advisor/RuleBasedAdvisor';
import type { AdvisorOpportunity } from '../advisor/types';
import { listUserDocuments } from '../database/userRepository';

export default function ActionsPage() {
  const { user } = useAuth();
  const advisor = useMemo(() => new RuleBasedAdvisor(), []);
  const [items, setItems] = useState<AdvisorOpportunity[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    if (user === null) return;
    let active = true;
    void Promise.all([listUserDocuments(user.uid, 'payrollChecks', 50), listUserDocuments(user.uid, 'accounts', 100), listUserDocuments(user.uid, 'expenses', 200)]).then(async ([salary, accounts, expenses]) => {
      const latestSalary = salary.at(-1)?.data;
      const salaryGap = typeof latestSalary?.['gap'] === 'number' ? latestSalary['gap'] : null;
      const liquid = accounts.filter(({ data }) => data['liquid'] === true).reduce((sum, { data }) => sum + Math.max(0, Number(data['balance'] ?? 0)), 0);
      const essentialTotal = expenses.filter(({ data }) => data['essential'] === true).reduce((sum, { data }) => sum + Number(data['amount'] ?? 0), 0);
      const coverage = essentialTotal > 0 ? liquid / essentialTotal : null;
      const opportunities = await advisor.analyze({ emergencyFundMonths: coverage, realEstateProjectMonthsAway: null, expensiveDebtRate: null, peaAgeYears: null, salaryGap });
      if (active) setItems(opportunities);
    }).catch(() => { if (active) setItems([]); });
    return () => { active = false; };
  }, [advisor, user]);
  return <>
    <section className="page-heading"><div><p className="eyebrow">ACTION CENTER</p><h1>À faire</h1><p>Maximum sept actions visibles, classées par priorité et explicables. Aucun ordre de bourse, virement ou crédit n’est exécuté.</p></div></section>
    <section className="panel"><div className="panel-heading"><h2>Aujourd’hui / cette semaine</h2><span className="badge">RULE_BASED</span></div>{items.length === 0 ? <p className="muted">Aucune action calculable avec les données actuellement disponibles. Complétez les modules utiles plutôt que d’inventer une recommandation.</p> : items.slice(0, 7).map((item) => <article className="action-row" key={item.id}><div><span className="eyebrow">{item.category} · urgence {item.urgency}</span><h3>{item.title}</h3><p>{item.description}</p><button onClick={() => setOpenId(openId === item.id ? null : item.id)}>Pourquoi ?</button>{openId === item.id ? <div className="explanation"><p><strong>Données utilisées :</strong> {item.dataUsed.join(', ') || 'aucune donnée supplémentaire'}</p><p><strong>Règle :</strong> {item.reason}</p><p><strong>Hypothèses :</strong> {item.assumptions.join(', ') || 'aucune'}</p><p><strong>Risque :</strong> {item.risk} · <strong>Confiance :</strong> {Math.round(item.confidence * 100)} %</p>{item.sources.map((source) => source.url ? <a key={source.title} href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : <span key={source.title}>{source.title}</span>)}</div> : null}</div></article>)}</section>
  </>;
}
