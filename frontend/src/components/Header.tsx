import React, { useEffect, useState } from 'react';
import xamaleLogo from '../assets/logo.png';

interface HeaderProps {
  onOpenSettings?: () => void;
  onOpenAbout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenAbout }) => {
  const [backendReady, setBackendReady] = useState<boolean>(false);

  useEffect(() => {
    // Vérification de la santé du backend Express (:3001)
    const checkBackend = () => {
      fetch('http://localhost:3001/api/health')
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'ok') setBackendReady(true);
        })
        .catch(() => setBackendReady(false));
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo-container">
          <img src={xamaleLogo} alt="XamaleScrape Logo" className="brand-logo-img" />
        </div>
        <div className="brand-text">
          <div className="brand-title-row">
            <span className="brand-name">
              Xamale<span className="brand-accent-gold">Scrape</span>
            </span>
            <span className="status-badge">
              <span className={`status-dot ${backendReady ? 'active' : ''}`} />
              <span>{backendReady ? 'Moteur IA Prêt' : 'En veille'}</span>
            </span>
          </div>
          <span className="brand-sub">Web Extraction &amp; Structuration de Données</span>
          <span className="brand-slogan">« Votre passerelle vers une IA sûre et innovante »</span>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenSettings}
          title="Paramètres avancés"
          id="btn-header-settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
        </button>

        <button
          type="button"
          className="user-avatar-btn"
          onClick={onOpenAbout}
          title="Informations Système & Session XamaleScrape"
          id="btn-header-avatar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </button>
      </div>
    </header>
  );
};
