import { useAuth } from '../auth/AuthContext';
import { PublicShell } from '../components/AppShell';

export default function LockedPage() {
  const { unlock, signOutNow, errorMessage } = useAuth();
  return <PublicShell><section className="auth-panel"><p className="eyebrow">APPLICATION VERROUILLÉE</p><h1>Montants masqués et données retirées de l’écran.</h1><p>Réauthentifiez-vous pour reprendre la session.</p><div className="button-row"><button className="primary" onClick={() => { void unlock(); }}>Déverrouiller</button><button onClick={() => { void signOutNow(); }}>Déconnexion</button></div>{errorMessage ? <p className="error" role="alert">{errorMessage}</p> : null}</section></PublicShell>;
}
