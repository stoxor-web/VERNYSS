import { useAuth } from '../auth/AuthContext';
import { PublicShell } from '../components/AppShell';

export default function LoginPage() {
  const { signIn, errorMessage } = useAuth();
  return <PublicShell><section className="auth-panel">
    <p className="eyebrow">PRIVATE FINANCE OPERATING SYSTEM</p>
    <h1>Vos finances, pilotées sans sacrifier votre confidentialité.</h1>
    <p>Application personnelle française : budget, salaire, patrimoine, fiscalité, immobilier et décisions explicables. Google authentifie votre identité ; l’allowlist décide de l’accès.</p>
    <button className="primary" onClick={() => { void signIn(); }}>Se connecter avec Google</button>
    {errorMessage ? <p className="error" role="alert">{errorMessage}</p> : null}
    <p className="fine-print">Aucune donnée financière n’est accessible avant authentification <em>et</em> autorisation.</p>
  </section></PublicShell>;
}
