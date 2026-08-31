import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase/config';
import { listUserDocuments } from '../database/userRepository';

interface NewsItem {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  category: string;
  score: number;
  whyItMatters: string;
  possibleAction: string;
  fetchedAt: Date | null;
  personalScore: number;
}

export default function NewsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (user === null) return;
    let active = true;
    void Promise.all([
      getDocs(query(collection(db, 'publicContent', 'news', 'items'), orderBy('score', 'desc'), limit(60))),
      listUserDocuments(user.uid, 'accounts', 100),
      listUserDocuments(user.uid, 'investments', 100),
      listUserDocuments(user.uid, 'properties', 100)
    ]).then(([news, accounts, investments, properties]) => {
      const ownsPea = accounts.some(({ data }) => data['kind'] === 'pea') || investments.some(({ data }) => data['envelope'] === 'PEA');
      const ownsCto = accounts.some(({ data }) => data['kind'] === 'cto') || investments.some(({ data }) => data['envelope'] === 'CTO');
      const hasRental = properties.some(({ data }) => data['type'] === 'rental');
      const mapped = news.docs.map((item) => {
        const data = item.data();
        const title = String(data['title'] ?? 'Actualité');
        const haystack = title.toLocaleLowerCase('fr-FR');
        let bonus = 0;
        if (ownsPea && haystack.includes('pea')) bonus += 4;
        if (ownsCto && (haystack.includes('bourse') || haystack.includes('plus-value'))) bonus += 2;
        if (hasRental && (haystack.includes('location') || haystack.includes('dpe') || haystack.includes('loyer'))) bonus += 4;
        const ts = data['fetchedAt'] as { toDate?: () => Date } | undefined;
        return { id: item.id, title, url: String(data['url'] ?? ''), sourceName: String(data['sourceName'] ?? ''), category: String(data['category'] ?? ''), score: Number(data['score'] ?? 0), whyItMatters: String(data['whyItMatters'] ?? ''), possibleAction: String(data['possibleAction'] ?? ''), fetchedAt: ts?.toDate?.() ?? null, personalScore: Number(data['score'] ?? 0) + bonus };
      }).sort((a, b) => b.personalScore - a.personalScore).slice(0, 20);
      if (active) setItems(mapped);
    }).catch(() => { if (active) setMessage('Actualités indisponibles. Le pipeline peut ne pas avoir encore publié de contenu.'); });
    return () => { active = false; };
  }, [user]);
  return <>
    <section className="page-heading"><div><p className="eyebrow">BRIEF & ACTUALITÉS</p><h1>Sources officielles d’abord, personnalisation locale ensuite.</h1><p>Le pipeline GitHub lit uniquement des sources allowlistées, traite leur contenu comme des données hostiles et ne leur transmet aucune donnée financière utilisateur.</p></div></section>
    <section className="panel"><div className="panel-heading"><h2>Brief du jour</h2><span className="muted">5 informations maximum</span></div>{items.length === 0 ? <p className="muted">{message ?? 'Aucune actualité publiée pour le moment.'}</p> : items.slice(0, 5).map((item) => <article className="news-row" key={item.id}><div><span className="eyebrow">{item.category} · {item.sourceName}</span><h3>{item.title}</h3><p><strong>Pourquoi cela vous concerne :</strong> {item.whyItMatters}</p><p><strong>Action possible :</strong> {item.possibleAction}</p></div><div className="news-meta"><span>{item.fetchedAt?.toLocaleDateString('fr-FR') ?? 'Date source à vérifier'}</span><a href={item.url} target="_blank" rel="noreferrer">Source officielle</a></div></article>)}</section>
    <section className="notice warning">Les textes externes ne sont jamais des instructions. Une phrase telle que « ignore previous instructions » dans une page source reste une donnée non fiable et n’a aucun pouvoir sur le pipeline.</section>
  </>;
}
