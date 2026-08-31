import { PublicShell } from '../components/AppShell';

export default function SecurityPage() {
  return <PublicShell><article className="legal-page"><p className="eyebrow">SÉCURITÉ</p><h1>Sécurité de l’application</h1><p>Aucun système n’est invulnérable. Cette application applique une sécurité en profondeur adaptée à des données financières personnelles.</p>
    <h2>Authentification et autorisation</h2><p>Google Sign-In est utilisé via Firebase Authentication. Être authentifié ne suffit pas : le compte doit également être présent et actif dans une allowlist administrée séparément. Les règles Firestore vérifient l’UID et refusent par défaut les accès non prévus.</p>
    <h2>Protection des données</h2><p>Les données utilisateur sont rangées sous leur UID. Les écritures sont contrôlées par schéma, types, bornes et champs autorisés. Les champs d’audit sont protégés contre la réécriture de leur date de création. Les pages publiques ne chargent aucune donnée Firestore personnelle.</p>
    <h2>Défense côté navigateur</h2><p>Le contenu utilisateur est rendu comme texte React, sans injection HTML. Une politique CSP restrictive, des en-têtes anti-sniffing, de confidentialité des référents et de permissions sont configurés sur Firebase Hosting. Les montants peuvent être masqués visuellement et l’application peut être verrouillée immédiatement.</p>
    <h2>Secrets et déploiement</h2><p>Aucune clé privée ni compte de service JSON ne doit être stocké dans Git. Le déploiement est conçu pour utiliser l’identité OIDC de GitHub et Workload Identity Federation afin d’obtenir des identifiants temporaires. La clé Web Firebase visible dans le bundle n’est pas considérée comme un mot de passe ; la sécurité repose sur Auth, Rules, App Check et les restrictions de clé/API.</p>
    <h2>Signalement</h2><p>Ne publiez pas de preuve contenant des données réelles. La procédure complète de réponse à incident, de révocation et de rotation figure dans <code>SECURITY.md</code> du dépôt.</p>
  </article></PublicShell>;
}
