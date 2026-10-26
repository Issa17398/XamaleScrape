import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendReady: boolean;
  waitForDynamic: boolean;
  onToggleDynamic: (val: boolean) => void;
  followInternalOnly: boolean;
  onToggleInternalOnly: (val: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  backendReady,
  waitForDynamic,
  onToggleDynamic,
  followInternalOnly,
  onToggleInternalOnly,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <div>
              <h3 className="modal-title">Paramètres XamaleScrape</h3>
              <p className="modal-desc">Configuration globale du moteur d'extraction</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h4 className="settings-subheading">Options de Rendu & Crawl</h4>

            <label className="settings-toggle-row">
              <div className="toggle-label-wrap">
                <span className="toggle-title">Rendu JavaScript Dynamique</span>
                <span className="toggle-subtitle">Active le décodage des frameworks modernes (React, Next.js, Vue).</span>
              </div>
              <input
                type="checkbox"
                className="custom-toggle"
                checked={waitForDynamic}
                onChange={(e) => onToggleDynamic(e.target.checked)}
              />
            </label>

            <label className="settings-toggle-row">
              <div className="toggle-label-wrap">
                <span className="toggle-title">Isolation stricte au nom d'hôte</span>
                <span className="toggle-subtitle">Ne suit que les liens internes du même domaine (Anti-fuite externe).</span>
              </div>
              <input
                type="checkbox"
                className="custom-toggle"
                checked={followInternalOnly}
                onChange={(e) => onToggleInternalOnly(e.target.checked)}
              />
            </label>
          </div>

          <div className="settings-section">
            <h4 className="settings-subheading">Statut des Microservices</h4>
            <div className="service-status-list">
              <div className="service-status-item">
                <span>Orchestrateur Express (:3001)</span>
                <span className={`status-pill ${backendReady ? 'status-ok' : 'status-off'}`}>
                  {backendReady ? 'Connecté' : 'En veille'}
                </span>
              </div>
              <div className="service-status-item">
                <span>Moteur Python Scraper (:8000)</span>
                <span className="status-pill status-ok">Opérationnel</span>
              </div>
              <div className="service-status-item">
                <span>Générateur PDF ReportLab</span>
                <span className="status-pill status-ok">Prêt</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-modal-primary" onClick={onClose}>
            Enregistrer & Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge brand-badge">
              <span>★</span>
            </div>
            <div>
              <h3 className="modal-title">XamaleScrape v1.0.0</h3>
              <p className="modal-desc">Web Extraction & Data Structuring</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <div className="modal-body">
          <div className="about-slogan-box">
            <p className="about-slogan">« Du Web aux données structurées. »</p>
            <p className="about-sub">Votre passerelle vers une IA sûre et innovante.</p>
          </div>

          <div className="about-specs-grid">
            <div className="spec-card">
              <span className="spec-label">Portée Crawl</span>
              <span className="spec-val">1 à 25 pages</span>
            </div>
            <div className="spec-card">
              <span className="spec-label">Format de sortie</span>
              <span className="spec-val">PDF & JSON</span>
            </div>
            <div className="spec-card">
              <span className="spec-label">Protection</span>
              <span className="spec-val">Anti-SSRF Strict</span>
            </div>
            <div className="spec-card">
              <span className="spec-label">Stockage</span>
              <span className="spec-val">Local sécurisé</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-modal-primary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

interface FeatureModalProps {
  featureId: string | null;
  onClose: () => void;
}

export const FeatureModal: React.FC<FeatureModalProps> = ({ featureId, onClose }) => {
  if (!featureId) return null;

  const features: Record<string, { title: string; desc: string; bullets: string[] }> = {
    'texte-pur': {
      title: 'Texte pur & Markdown',
      desc: 'Élimination algorithmique des artefacts non pertinents pour ne conserver que la substantifique moelle du contenu.',
      bullets: [
        'Suppression automatique des bannières de cookies, scripts, styles et balises iframe.',
        'Conservation fidèle des niveaux de titres H1, H2, H3 et des listes à puces.',
        'Idéal pour l’ingestion directe dans des modèles d’IA et bases vectorielles RAG.',
      ],
    },
    'crawl-recursif': {
      title: 'Crawl Récursif (max 25 pages)',
      desc: 'Exploration en largeur contrôlée et respectueuse des serveurs cibles.',
      bullets: [
        'Filtrage strict sur le même nom d’hôte pour éviter les dérives de domaine.',
        'Gestion dynamique de la file d’attente jusqu’à la limite paramétrée (1 à 25 pages).',
        'Temporisation de politesse (150ms) évitant tout blocage ou déni de service.',
      ],
    },
    'export-pdf-json': {
      title: 'Export PDF & JSON Structuré',
      desc: 'Deux livrables complémentaires générés immédiatement à la fin du traitement.',
      bullets: [
        'Rapport PDF complet avec page de garde, métadonnées, sommaire et pagination soignée.',
        'Export JSON exhaustif contenant le texte brut, les métadonnées et la structure de chaque page.',
        'Téléchargement direct en un clic depuis votre tableau de bord.',
      ],
    },
  };

  const current = features[featureId] || features['texte-pur'];

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{current.title}</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-desc" style={{ marginBottom: '1rem', fontSize: '0.92rem', color: '#334155' }}>
            {current.desc}
          </p>
          <ul className="feature-bullets-list">
            {current.bullets.map((b, i) => (
              <li key={i} className="feature-bullet-item">
                <span className="bullet-check">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-modal-primary" onClick={onClose}>
            Compris
          </button>
        </div>
      </div>
    </div>
  );
};
