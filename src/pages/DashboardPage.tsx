import { useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { Money } from '../components/Money';
import {
  loadDashboardSummary,
  saveMonthlySnapshot,
  type AllocationSlice,
  type DashboardSummary,
} from '../database/dashboard';
import { navigate } from '../hooks/usePath';

function percent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${Math.round(value * 100)} %`;
}

function months(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  if (value >= 120) return '120+ mois';
  return `${value.toFixed(value < 10 ? 1 : 0)} mois`;
}

function AllocationBar({ slices }: { slices: AllocationSlice[] }) {
  const total = slices.reduce((sum, item) => sum + item.value, 0);

  return <div className="allocation-visual">
    <div className="allocation-track" aria-label="Répartition du patrimoine brut">
      {slices.map((slice) => {
        const width = total > 0 ? (slice.value / total) * 100 : 0;
        return <span
          key={slice.key}
          className={`allocation-segment allocation-${slice.key}`}
          style={{ width: `${width}%` }}
          title={`${slice.label} : ${Math.round(width)} %`}
        />;
      })}
    </div>
    <div className="allocation-legend">
      {slices.map((slice) => <div key={slice.key}>
        <span className={`allocation-key allocation-${slice.key}`} />
        <span>{slice.label}</span>
        <strong>{total > 0 ? `${Math.round((slice.value / total) * 100)} %` : '—'}</strong>
      </div>)}
    </div>
  </div>;
}

function ResilienceLine({
  label,
  value,
  display,
  caution = false,
}: {
  label: string;
  value: number;
  display: string;
  caution?: boolean;
}) {
  const bounded = Math.max(0, Math.min(1, value));

  return <div className="resilience-line">
    <div className="resilience-label">
      <span>{label}</span>
      <strong className={caution ? 'finance-caution' : ''}>{display}</strong>
    </div>
    <div className="resilience-track">
      <span className={caution ? 'caution' : ''} style={{ width: `${bounded * 100}%` }} />
    </div>
  </div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);

  const reload = async () => {
    if (user === null) return;
    const data = await loadDashboardSummary(user.uid);
    setSummary(data);
  };

  useEffect(() => {
    if (user === null) return;

    let active = true;
    void loadDashboardSummary(user.uid)
      .then((data) => {
        if (active) {
          setSummary(data);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError('Impossible de charger le cockpit financier.');
      });

    return () => {
      active = false;
    };
  }, [user]);

  const createSnapshot = async () => {
    if (user === null || summary === null) return;

    try {
      const period = await saveMonthlySnapshot(user.uid, summary);
      setSnapshotMessage(`Photographie ${period} enregistrée.`);
      await reload();
    } catch {
      setSnapshotMessage('La photographie mensuelle n’a pas pu être enregistrée.');
    }
  };

  if (summary === null) {
    return <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">COCKPIT PATRIMONIAL</p>
          <h1>Votre situation financière, consolidée.</h1>
          <p>Actifs, dettes, liquidité, flux et objectifs réunis dans une même lecture.</p>
        </div>
      </section>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <EmptyState title="Chargement du cockpit">Les données restent isolées dans votre espace privé.</EmptyState>
    </>;
  }

  const salaryGap = summary.salaryExpected === null
    ? null
    : (summary.salaryActual ?? 0) - summary.salaryExpected;

  const goalFundingRate = summary.goalsTarget > 0
    ? summary.goalsCurrent / summary.goalsTarget
    : null;

  const liquidityShare = summary.assets > 0
    ? summary.liquidAssets / summary.assets
    : 0;

  const runwayScale = summary.runwayMonths === null
    ? 0
    : Math.min(summary.runwayMonths / 12, 1);

  const debtScale = summary.debtToAssetRatio === null
    ? 0
    : Math.min(summary.debtToAssetRatio, 1);

  const maxSnapshotWorth = Math.max(
    1,
    ...summary.snapshots.map((item) => Math.abs(item.netWorth)),
  );

  return <>
    <section className="page-heading cockpit-heading">
      <div>
        <p className="eyebrow">COCKPIT PATRIMONIAL</p>
        <h1>Votre capital. Vos flux. Vos décisions.</h1>
        <p>VERNYSS consolide les données que vous renseignez sans inventer de solde bancaire ni de performance.</p>
      </div>
      <div className="heading-actions">
        <button onClick={() => navigate('/wealth')}>Gérer le patrimoine</button>
        <button className="primary" onClick={() => { void createSnapshot(); }}>Clôturer le mois</button>
      </div>
    </section>

    {error ? <p className="error" role="alert">{error}</p> : null}
    {snapshotMessage ? <p className="finance-status" role="status">{snapshotMessage}</p> : null}

    <section className="capital-strip" aria-label="Indicateurs principaux">
      <article className="capital-primary">
        <span className="capital-label">Patrimoine net</span>
        <strong><Money value={summary.netWorth} /></strong>
        <small><Money value={summary.assets} /> d’actifs · <Money value={summary.debts} /> de dettes</small>
      </article>

      <article>
        <span className="capital-label">Liquidités mobilisables</span>
        <strong><Money value={summary.liquidAssets} /></strong>
        <small>{percent(liquidityShare)} des actifs déclarés</small>
      </article>

      <article>
        <span className="capital-label">Flux disponible · mois</span>
        <strong className={summary.monthlyCashFlow < 0 ? 'finance-negative' : ''}>
          <Money value={summary.monthlyCashFlow} signed />
        </strong>
        <small>{percent(summary.monthlySavingsRate)} du revenu après dépenses & investissements</small>
      </article>

      <article>
        <span className="capital-label">Réserve théorique</span>
        <strong>{months(summary.runwayMonths)}</strong>
        <small>Liquidités ÷ dépenses du mois courant</small>
      </article>
    </section>

    <section className="cockpit-grid">
      <article className="panel balance-sheet">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">BILAN CONSOLIDÉ</p>
            <h2>Structure patrimoniale</h2>
          </div>
          <span className="muted">{summary.accounts.length} compte{summary.accounts.length > 1 ? 's' : ''}</span>
        </div>

        <div className="balance-main">
          <div>
            <span>Actifs bruts</span>
            <strong><Money value={summary.assets} /></strong>
          </div>
          <span className="balance-operator">−</span>
          <div>
            <span>Dettes</span>
            <strong><Money value={summary.debts} /></strong>
          </div>
          <span className="balance-operator">=</span>
          <div className="balance-net">
            <span>Capital net</span>
            <strong><Money value={summary.netWorth} /></strong>
          </div>
        </div>

        <AllocationBar slices={summary.allocation} />

        <div className="account-preview">
          {summary.accounts.length === 0
            ? <p className="muted">Aucun compte déclaré. Ajoutez vos comptes pour constituer le bilan.</p>
            : summary.accounts
              .slice()
              .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
              .slice(0, 5)
              .map((account) => <div className="ledger-row" key={account.id}>
                <span>{account.name}<small>{account.liquid ? 'Liquide' : 'Long terme'}</small></span>
                <Money value={account.balance} signed={account.balance < 0} />
              </div>)}
        </div>
      </article>

      <article className="panel resilience-panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">RÉSILIENCE</p>
            <h2>Capacité financière</h2>
          </div>
          <span className="status-pill neutral">Indicateurs</span>
        </div>

        <div className="resilience-stack">
          <ResilienceLine
            label="Réserve de liquidité"
            value={runwayScale}
            display={months(summary.runwayMonths)}
            caution={summary.runwayMonths !== null && summary.runwayMonths < 3}
          />
          <ResilienceLine
            label="Poids de la dette"
            value={debtScale}
            display={percent(summary.debtToAssetRatio)}
            caution={summary.debtToAssetRatio !== null && summary.debtToAssetRatio > 0.5}
          />
          <ResilienceLine
            label="Financement des objectifs"
            value={goalFundingRate === null ? 0 : Math.min(goalFundingRate, 1)}
            display={percent(goalFundingRate)}
          />
        </div>

        <div className="finance-divider" />

        <div className="signal-list">
          <div>
            <span>Revenus du mois</span>
            <Money value={summary.monthlyIncome} />
          </div>
          <div>
            <span>Dépenses du mois</span>
            <Money value={summary.monthlyExpenses} />
          </div>
          <div>
            <span>Investissement programmé</span>
            <Money value={summary.monthlyAutomaticInvestments} />
          </div>
          <div>
            <span>Cohérence salariale</span>
            {salaryGap === null ? <strong className="muted">Non contrôlée</strong> : <Money value={salaryGap} signed />}
          </div>
        </div>
      </article>
    </section>

    <section className="cockpit-grid cockpit-grid-secondary">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">CAPITAL INVESTI</p>
            <h2>Portefeuille titres</h2>
          </div>
          <Money value={summary.investedMarketValue} />
        </div>

        <div className="portfolio-spread">
          <div>
            <span>Coût de revient suivi</span>
            <strong><Money value={summary.investmentCost} /></strong>
          </div>
          <div>
            <span>Valeur actuelle saisie</span>
            <strong><Money value={summary.investedMarketValue} /></strong>
          </div>
          <div>
            <span>Latent indicatif</span>
            <strong className={summary.unrealizedInvestmentGain < 0 ? 'finance-negative' : ''}>
              <Money value={summary.unrealizedInvestmentGain} signed />
            </strong>
          </div>
        </div>

        <p className="fine-print finance-footnote">
          La valeur des positions sert au suivi des investissements. Le bilan patrimonial reste fondé sur les soldes de comptes afin d’éviter un double comptage.
        </p>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">OBJECTIFS</p>
            <h2>Capital affecté</h2>
          </div>
          <Money value={summary.goalsCurrent} />
        </div>

        {summary.goals.length === 0
          ? <p className="muted">Aucun objectif financier défini.</p>
          : <div className="goal-stack">
            {summary.goals.slice(0, 4).map((goal) => {
              const progress = goal.targetAmount > 0
                ? Math.min(goal.currentAmount / goal.targetAmount, 1)
                : 0;

              return <div className="goal-line" key={goal.id}>
                <div>
                  <strong>{goal.name}</strong>
                  <span><Money value={goal.currentAmount} /> / <Money value={goal.targetAmount} /></span>
                </div>
                <div className="goal-progress">
                  <span style={{ width: `${progress * 100}%` }} />
                </div>
              </div>;
            })}
          </div>}
      </article>
    </section>

    <section className="panel history-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">HISTORIQUE</p>
          <h2>Photographies mensuelles</h2>
        </div>
        <span className="muted">{summary.snapshots.length} période{summary.snapshots.length > 1 ? 's' : ''}</span>
      </div>

      {summary.snapshots.length === 0
        ? <div className="history-empty">
          <p>Aucune clôture enregistrée. Le bouton « Clôturer le mois » crée une photographie stable du patrimoine et des flux.</p>
        </div>
        : <div className="history-bars">
          {summary.snapshots.map((snapshot) => {
            const width = Math.max(3, (Math.abs(snapshot.netWorth) / maxSnapshotWorth) * 100);
            return <div className="history-row" key={snapshot.period}>
              <span>{snapshot.period}</span>
              <div><i className={snapshot.netWorth < 0 ? 'negative' : ''} style={{ width: `${width}%` }} /></div>
              <strong><Money value={snapshot.netWorth} /></strong>
            </div>;
          })}
        </div>}
    </section>
  </>;
}
