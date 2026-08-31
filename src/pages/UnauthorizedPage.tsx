import { useAuth } from '../auth/AuthContext';
import { PublicShell } from '../components/AppShell';

export default function UnauthorizedPage() {
  const { signOutNow } = useAuth();
  return <PublicShell><section className="auth-panel"><p className="eyebrow">ACCÈS REFUSÉ</p><h1>Compte non autorisé</h1><p>Votre compte est authentifié mais n’est pas autorisé à utiliser cette application.</p><button onClick={() => { void signOutNow(); }}>Déconnexion</button></section></PublicShell>;
}
