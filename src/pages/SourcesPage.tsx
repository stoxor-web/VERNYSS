import { PublicShell } from '../components/AppShell';

const sources = [
  ['Fiscalité', 'impots.gouv.fr', 'Règles fiscales, PEA, revenus mobiliers, cessions mobilières'],
  ['Droits et réglementation', 'service-public.fr', 'Règles administratives et logement'],
  ['Économie', 'economie.gouv.fr', 'Épargne, réglementation et actualités économiques'],
  ['Investisseurs', 'amf-france.org', 'Protection de l’épargnant et marchés'],
  ['Crédit / taux', 'banque-france.fr', 'Données et informations monétaires'],
  ['Statistiques', 'insee.fr · ec.europa.eu/eurostat', 'Indicateurs économiques'],
  ['Immobilier', 'anil.org · data.gouv.fr', 'Information logement et données publiques'],
  ['Énergie / DPE', 'ademe.fr', 'Information énergétique']
] as const;

export default function SourcesPage() {
  return <PublicShell><article className="legal-page"><p className="eyebrow">SOURCES & MÉTHODOLOGIE</p><h1>Des calculs explicables, avec une frontière nette entre faits et hypothèses.</h1><p>Les règles fiscales et réglementaires portent une version, une période d’effet, une source, une date de vérification et un statut de fraîcheur. Une règle insuffisamment étayée est présentée « À confirmer » plutôt que transformée en certitude.</p><div className="table-wrap"><table><thead><tr><th>Domaine</th><th>Source prioritaire</th><th>Usage</th></tr></thead><tbody>{sources.map(([domain, source, usage]) => <tr key={domain}><td>{domain}</td><td>{source}</td><td>{usage}</td></tr>)}</tbody></table></div><h2>Actualités</h2><p>Le pipeline est limité à des domaines officiels allowlistés, contrôle robots.txt de manière conservatrice, limite la taille des réponses, n’essaie pas de contourner les paywalls et traite tout texte externe comme une donnée non fiable. La personnalisation finale est effectuée côté application à partir de vos propres données.</p><h2>Recommandations</h2><p>Chaque recommandation doit pouvoir afficher les données utilisées, la règle, les hypothèses, les risques et les sources. Les moteurs ne passent aucun ordre financier et ne déclenchent aucun virement.</p></article></PublicShell>;
}
