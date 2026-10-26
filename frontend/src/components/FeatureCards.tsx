import React from 'react';

interface FeatureCardsProps {
  onSelectFeature?: (featureId: string) => void;
}

export const FeatureCards: React.FC<FeatureCardsProps> = ({ onSelectFeature }) => {
  return (
    <div className="feature-cards-grid">
      <button
        type="button"
        className="feature-mini-card"
        onClick={() => onSelectFeature?.('texte-pur')}
        title="Détails : Nettoyage sémantique et extraction de texte pur"
      >
        <div className="feature-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 7 4 4 20 4 20 7"></polyline>
            <line x1="9" y1="20" x2="15" y2="20"></line>
            <line x1="12" y1="4" x2="12" y2="20"></line>
          </svg>
        </div>
        <span className="feature-label">Texte pur & Markdown</span>
      </button>

      <button
        type="button"
        className="feature-mini-card"
        onClick={() => onSelectFeature?.('crawl-recursif')}
        title="Détails : Crawling automatique et récursif jusqu'à 100 pages"
      >
        <div className="feature-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="6" height="6" rx="1"></rect>
            <rect x="16" y="3" width="6" height="6" rx="1"></rect>
            <rect x="9" y="15" width="6" height="6" rx="1"></rect>
            <path d="M5 9v3a2 2 0 0 0 2 2h5"></path>
            <path d="M19 9v3a2 2 0 0 1-2 2h-5"></path>
          </svg>
        </div>
        <span className="feature-label">Crawl Récursif (max 100p)</span>
      </button>

      <button
        type="button"
        className="feature-mini-card"
        onClick={() => onSelectFeature?.('export-pdf-json')}
        title="Détails : Génération instantanée de livrables PDF & JSON"
      >
        <div className="feature-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        <span className="feature-label">Export PDF & JSON</span>
      </button>
    </div>
  );
};
