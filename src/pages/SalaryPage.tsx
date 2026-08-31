import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Money } from '../components/Money';
import { StatusPill } from '../components/StatusPill';
import { addUserDocument } from '../database/userRepository';
import { SalaryCheckEngine } from '../salary/SalaryCheckEngine';
import type { SalaryCheckResult, SalaryLine } from '../salary/types';

interface SalaryFormState {
  period: string;
  baseGross: string;
  hourlyRate: string;
  overtime25Hours: string;
  overtime50Hours: string;
  onCall: string;
  presenceDuty: string;
  bonus: string;
  reimbursements: string;
  deductions: string;
  contributionRate: string;
  withholdingRate: string;
  actualNet: string;
}

const initialState: SalaryFormState = {
  period: new Date().toISOString().slice(0, 7), baseGross: '', hourlyRate: '', overtime25Hours: '0', overtime50Hours: '0',
  onCall: '0', presenceDuty: '0', bonus: '0', reimbursements: '0', deductions: '0', contributionRate: '22', withholdingRate: '0', actualNet: ''
};

function n(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new RangeError('Toutes les valeurs doivent être des nombres positifs ou nuls.');
  return parsed;
}

export default function SalaryPage() {
  const { user } = useAuth();
  const engine = useMemo(() => new SalaryCheckEngine(), []);
  const [form, setForm] = useState(initialState);
  const [result, setResult] = useState<SalaryCheckResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const calculate = () => {
    try {
      const hourlyRate = n(form.hourlyRate);
      const lines: SalaryLine[] = [
        { id: 'base', label: 'Salaire de base', kind: 'base', amount: n(form.baseGross), subjectToContributions: true, subjectToIncomeTax: true },
        { id: 'hs25', label: 'Heures supplémentaires — majoration configurée 25 %', kind: 'overtime', hours: n(form.overtime25Hours), hourlyRate, upliftRate: 0.25, subjectToContributions: true, subjectToIncomeTax: true },
        { id: 'hs50', label: 'Heures supplémentaires — majoration configurée 50 %', kind: 'overtime', hours: n(form.overtime50Hours), hourlyRate, upliftRate: 0.50, subjectToContributions: true, subjectToIncomeTax: true },
        { id: 'oncall', label: 'Astreinte', kind: 'onCall', amount: n(form.onCall), subjectToContributions: true, subjectToIncomeTax: true },
        { id: 'presence', label: 'Permanence', kind: 'presenceDuty', amount: n(form.presenceDuty), subjectToContributions: true, subjectToIncomeTax: true },
        { id: 'bonus', label: 'Prime', kind: 'bonus', amount: n(form.bonus), subjectToContributions: true, subjectToIncomeTax: true },
        { id: 'expenses', label: 'Remboursements de frais', kind: 'expenseReimbursement', amount: n(form.reimbursements), subjectToContributions: false, subjectToIncomeTax: false },
        { id: 'deduction', label: 'Retenues / absences / acomptes', kind: 'deduction', amount: n(form.deductions), subjectToContributions: true, subjectToIncomeTax: true }
      ];
      const next = engine.calculate({
        lines,
        estimatedEmployeeContributionRate: n(form.contributionRate) / 100,
        withholdingRate: n(form.withholdingRate) / 100,
        ...(form.actualNet.trim() === '' ? {} : { actualNetPaid: n(form.actualNet) })
      });
      setResult(next);
      setMessage(null);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Calcul impossible.');
    }
  };

  const saveCheck = async () => {
    if (user === null || result === null || result.actualNetPaid === undefined || result.gap === undefined || result.gapPercent === undefined || result.status === 'notCompared') return;
    await addUserDocument(user.uid, 'payrollChecks', {
      period: form.period,
      expectedNet: result.expectedNetPaid,
      actualNet: result.actualNetPaid,
      gap: result.gap,
      gapPercent: result.gapPercent,
      status: result.status,
      warning: 'Une incohérence potentielle est détectée. Vérifiez votre bulletin / service paie.'
    });
    setMessage('Contrôle enregistré dans votre espace privé.');
  };

  const fields: Array<[keyof SalaryFormState, string, string]> = [
    ['baseGross', 'Salaire de base brut', '€'], ['hourlyRate', 'Taux horaire brut', '€/h'], ['overtime25Hours', 'Heures supp. — preset 25 %', 'h'],
    ['overtime50Hours', 'Heures supp. — preset 50 %', 'h'], ['onCall', 'Astreintes', '€'], ['presenceDuty', 'Permanences', '€'], ['bonus', 'Primes', '€'],
    ['reimbursements', 'Remboursements de frais', '€'], ['deductions', 'Retenues / absences / acomptes', '€'], ['contributionRate', 'Cotisations estimées', '%'],
    ['withholdingRate', 'PAS', '%'], ['actualNet', 'Net réellement versé', '€']
  ];

  return <>
    <section className="page-heading"><div><p className="eyebrow">SALAIRE & FICHE DE PAIE</p><h1>Contrôler le versement, sans sur-promettre la précision.</h1><p>Le moteur sépare brut soumis, remboursements, estimation des cotisations et PAS. Vérification conventionnelle non disponible tant qu’elle n’est pas configurée.</p></div></section>
    <section className="split-grid salary-layout">
      <article className="panel"><div className="panel-heading"><h2>Calcul mensuel</h2><span className="badge">ESTIMATION</span></div>
        <label>Période<input type="month" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} /></label>
        <div className="form-grid">{fields.map(([key, label, suffix]) => <label key={key}>{label}<span className="input-with-suffix"><input inputMode="decimal" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} aria-label={label} /><span>{suffix}</span></span></label>)}</div>
        <p className="fine-print">Les majorations 25 % et 50 % sont des préréglages modifiables dans le moteur, pas une vérité universelle. À confirmer avec votre convention collective ou accord d’entreprise.</p>
        <div className="button-row"><button className="primary" onClick={calculate}>Voir le calcul</button>{result?.actualNetPaid !== undefined ? <button onClick={() => { void saveCheck().catch(() => setMessage('Enregistrement impossible.')); }}>Comparer et enregistrer</button> : null}</div>{message ? <p role="status">{message}</p> : null}
      </article>
      <article className="panel salary-result"><div className="panel-heading"><h2>Contrôle</h2>{result ? <StatusPill tone={result.status === 'ok' ? 'ok' : result.status === 'minorGap' ? 'warning' : result.status === 'review' ? 'danger' : 'neutral'}>{result.status === 'ok' ? 'OK' : result.status === 'minorGap' ? 'Écart mineur' : result.status === 'review' ? 'Écart à vérifier' : 'Non comparé'}</StatusPill> : null}</div>
        {result === null ? <p className="muted">Renseignez les éléments du mois pour obtenir une décomposition explicable.</p> : <>
          <div className="hero-amount"><span>Salaire théorique net</span><Money value={result.expectedNetPaid} /></div>
          {result.actualNetPaid !== undefined ? <><div className="ledger-row"><span>Salaire reçu</span><Money value={result.actualNetPaid} /></div><div className="ledger-row total"><span>Écart</span><Money value={result.gap} signed /></div></> : null}
          <div className="breakdown">{result.breakdown.filter((line) => Math.abs(line.amount) > 0.001).map((line) => <div className="ledger-row" key={line.id}><span>{line.label}</span><Money value={line.amount} signed /></div>)}<div className="ledger-row"><span>Cotisations estimées</span><Money value={-result.estimatedEmployeeContributions} signed /></div><div className="ledger-row"><span>PAS</span><Money value={-result.withholdingTax} signed /></div></div>
          <div className="notice warning">{result.warnings[0]}</div>
        </>}
      </article>
    </section>
    <section className="panel"><div className="panel-heading"><h2>Import bulletin</h2><span className="muted">Privacy first</span></div><p>Modes prévus : saisie manuelle, CSV local et PDF local. Aucun bulletin n’est envoyé automatiquement à une IA ou stocké dans GitHub. Toute analyse externe doit être activée séparément avec consentement explicite.</p></section>
  </>;
}
