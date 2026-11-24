import React from 'react';
import ReactDOM from 'react-dom/client';
import ShopApp from './ShopApp';
import '../styles.css';
import './shop.css';

if (new URLSearchParams(window.location.search).get('embed') === '1') {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ShopApp />
  </React.StrictMode>,
);
