import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { configureAppCheck } from './firebase/appCheck';
import { configureFirebaseClient } from './firebase/config';
import './styles/global.css';
import './styles/finance.css';

await configureFirebaseClient();
configureAppCheck();

const root = document.getElementById('root');
if (root === null) throw new Error('Élément racine introuvable.');
ReactDOM.createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
