import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { Metric } from '../components/Metric';
import { Money } from '../components/Money';
import { loadDashboardSummary, type DashboardSummary } from '../database/dashboard';
import { cashFlow, savingsRate } from '../financial/cashFlow';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (user === null) return;
    let active = true;
    void loadDashboardSummary(user.uid).then((data) => { if (active) setSummary(data); }).catch(() => { if (active) setError('Impossible de charger la synthèse.'); });
    return () => { active = false; };
  }, [user]);
  const derived = useMemo(() => {
    if (summary === null) return null;
    return {
      flow: cashFlow({ income: summary.monthlyIncome, expenses: summary.monthlyExpenses, automaticInvestments: summary.monthlyAutomaticInvestments }),
      rate: savingsRate(summary.monthlyIncome, summary.monthlyExpenses + summary.monthlyAutomaticInvestments)
    };
  }, [summary]);
  return <>
    <section className="page-heading"><div><p className="eyebrow">VUE D’ENSEMBLE</p><h1>Pilotage financier</h1><p>Une lecture condensée des données réellement présentes dans votre espace privé.</p></div></section>
    {error ? <p className="error" role="alert">{error}</p> : null}
    {summary === null ? <EmptyState title="Chargement de la synthèse">Les requêtes sont bornées et aucun historique complet n’est chargé au démarrage.</EmptyState> : <>
      <section className="metric-grid">
        <Metric label="Patrimoine net"><Money value={summary.netWorth} /></Metric>
        <Metric label="Cash-flow du mois"><Money value={derived?.flow} signed /></Metric>
        <Metric label="Taux d’épargne" note="Après investissements automatiques">{derived?.rate === null ? '—' : `${Math.round((derived?.rate ?? 0) * 100)} %`}</Metric>
        <Metric label="Salaire / cohérence">{summary.salaryExpected === null ? 'Non contrôlé' : <><Money value={(summary.salaryActual ?? 0) - summary.salaryExpected} signed /></>}</Metric>
      </section>
      <section className="split-grid">
        <article className="panel"><div className="panel-heading"><h2>Patrimoine</h2><span className="muted">Actifs – dettes</span></div><div className="ledger-row"><span>Actifs</span><Money value={summary.assets} /></div><div className="ledger-row"><span>Dettes</span><Money value={summary.debts} /></div><div className="ledger-row total"><span>Net</span><Money value={summary.netWorth} /></div></article>
        <article className="panel"><div className="panel-heading"><h2>Brief du jour</h2><span className="muted">Maximum 5 signaux</span></div><ol className="brief-list"><li>Cash-flow : <Money value={derived?.flow} signed /></li><li>Dépenses du mois : <Money value={summary.monthlyExpenses} /></li><li>Investissements automatiques : <Money value={summary.monthlyAutomaticInvestments} /></li><li>Fiscalité : vérifier la fraîcheur des règles avant simulation.</li><li>Action : compléter les données manquantes avant toute recommandation.</li></ol></article>
      </section>
    </>}
  </>;
}
