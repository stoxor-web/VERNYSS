import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { usePrivacy } from '../privacy/PrivacyContext';
import { navigate } from '../hooks/usePath';

const navGroups = [
  {
    label: 'Pilotage',
    items: [
      ['/', 'Vue d’ensemble'],
      ['/wealth', 'Patrimoine'],
      ['/budget', 'Budget'],
    ],
  },
  {
    label: 'Revenus & capital',
    items: [
      ['/salary', 'Salaire'],
      ['/investments', 'Investissements'],
      ['/real-estate', 'Immobilier'],
    ],
  },
  {
    label: 'Analyse',
    items: [
      ['/tax', 'Fiscalité'],
      ['/news', 'Brief & actualités'],
      ['/actions', 'À faire'],
    ],
  },
  {
    label: 'Données',
    items: [
      ['/settings/privacy/data', 'Mes données'],
    ],
  },
] as const;

function Brand() {
  return <div className="brand-lockup">
    <button className="brand" onClick={() => navigate('/')} aria-label="Accueil VERNYSS">
      <span className="brand-word">VERNYSS</span>
      <span className="brand-dot" aria-hidden="true" />
    </button>
    <span className="brand-signature">Private wealth system</span>
  </div>;
}

export function AppShell({ children, path }: { children: ReactNode; path: string }) {
  const { lock, signOutNow } = useAuth();
  const { hideAmounts, toggleHideAmounts } = usePrivacy();

  return <div className="app-shell">
    <header className="topbar">
      <Brand />
      <nav className="nav" aria-label="Navigation principale">
        {navGroups.map((group) => <div className="nav-group" key={group.label}>
          <span className="nav-group-label">{group.label}</span>
          {group.items.map(([href, label]) => <button key={href} className={path === href ? 'active' : ''} onClick={() => navigate(href)}>{label}</button>)}
        </div>)}
      </nav>
      <div className="top-actions">
        <button onClick={toggleHideAmounts} aria-label={hideAmounts ? 'Afficher les montants' : 'Masquer les montants'}>{hideAmounts ? 'Afficher €' : 'Masquer €'}</button>
        <button onClick={lock}>Verrouiller</button>
        <button onClick={() => { void signOutNow(); }}>Déconnexion</button>
      </div>
    </header>
    <main id="main-content" className="content">{children}</main>
    <Footer />
  </div>;
}

export function PublicShell({ children }: { children: ReactNode }) {
  return <div className="public-shell">
    <header className="public-header">
      <Brand />
      <button onClick={() => navigate('/')}>Application</button>
    </header>
    <main id="main-content" className="public-content">{children}</main>
    <Footer />
  </div>;
}

function Footer() {
  const year = new Date().getFullYear();

  return <footer>
    <span>© {year} — VERNYSS</span>
    <span>
      <button onClick={() => navigate('/privacy')}>Confidentialité & RGPD</button> · <button onClick={() => navigate('/settings/privacy/data')}>Gestion des données</button> · <button onClick={() => navigate('/security')}>Sécurité</button> · <button onClick={() => navigate('/sources')}>Sources & méthodologie</button>
    </span>
    <span>Version {import.meta.env.VITE_APP_VERSION ?? '0.1.0'}</span>
  </footer>;
}
