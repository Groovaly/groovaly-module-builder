import React from 'react';
import ReactDOM from 'react-dom/client';
import CobraApp from './CobraApp';
import '../styles.css';
import './cobra.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CobraApp />
  </React.StrictMode>,
);
