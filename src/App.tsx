import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AppShell, PublicShell } from './components/AppShell';
import { usePath } from './hooks/usePath';
import { PrivacyProvider } from './privacy/PrivacyContext';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import LockedPage from './pages/LockedPage';
import DashboardPage from './pages/DashboardPage';
import WealthPage from './pages/WealthPage';
import SalaryPage from './pages/SalaryPage';
import BudgetPage from './pages/BudgetPage';
import InvestmentsPage from './pages/InvestmentsPage';
import ActionsPage from './pages/ActionsPage';
import PrivacyPage from './pages/PrivacyPage';
import SecurityPage from './pages/SecurityPage';
import SourcesPage from './pages/SourcesPage';
import DataManagementPage from './pages/DataManagementPage';

const TaxPage = lazy(() => import('./pages/TaxPage'));
const RealEstatePage = lazy(() => import('./pages/RealEstatePage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));

function LoadingModule() {
  return <section className="empty-state" aria-live="polite"><strong>Chargement du module…</strong><p>Les modules lourds sont chargés à la demande.</p></section>;
}

function PublicRoute({ path }: { path: string }) {
  if (path === '/privacy') return <PrivacyPage />;
  if (path === '/security') return <SecurityPage />;
  if (path === '/sources') return <SourcesPage />;
  return null;
}

function AuthenticatedApp({ path }: { path: string }) {
  let page = <DashboardPage />;
  if (path === '/wealth') page = <WealthPage />;
  else if (path === '/salary') page = <SalaryPage />;
  else if (path === '/budget') page = <BudgetPage />;
  else if (path === '/investments') page = <InvestmentsPage />;
  else if (path === '/tax') page = <Suspense fallback={<LoadingModule />}><TaxPage /></Suspense>;
  else if (path === '/real-estate') page = <Suspense fallback={<LoadingModule />}><RealEstatePage /></Suspense>;
  else if (path === '/news') page = <Suspense fallback={<LoadingModule />}><NewsPage /></Suspense>;
  else if (path === '/actions') page = <ActionsPage />;
  else if (path === '/settings/privacy/data') page = <DataManagementPage />;
  return <AppShell path={path}>{page}</AppShell>;
}

function Gate() {
  const path = usePath();
  const { state, errorMessage, signOutNow } = useAuth();
  const publicPage = PublicRoute({ path });
  if (publicPage !== null) return publicPage;
  if (state === 'loading') return <PublicShell><section className="auth-panel"><p className="eyebrow">VÉRIFICATION D’ACCÈS</p><h1>Validation de la session et de l’allowlist…</h1></section></PublicShell>;
  if (state === 'signedOut') return <LoginPage />;
  if (state === 'unauthorized') return <UnauthorizedPage />;
  if (state === 'locked') return <LockedPage />;
  if (state === 'error') return <PublicShell><section className="auth-panel"><p className="eyebrow">ERREUR D’ACCÈS</p><h1>Autorisation impossible à vérifier.</h1><p>{errorMessage ?? 'Erreur technique.'}</p><button onClick={() => { void signOutNow(); }}>Revenir à la connexion</button></section></PublicShell>;
  return <AuthenticatedApp path={path} />;
}

export default function App() {
  return <AuthProvider><PrivacyProvider><a className="skip-link" href="#main-content">Aller au contenu</a><Gate /></PrivacyProvider></AuthProvider>;
}
