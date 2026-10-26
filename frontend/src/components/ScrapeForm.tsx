import React, { useState } from 'react';
import type { ScrapeConfig } from '../types';

interface ScrapeFormProps {
  onSubmit: (config: ScrapeConfig) => void;
  isLoading: boolean;
}

export const ScrapeForm: React.FC<ScrapeFormProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'single' | 'crawl'>('single');
  const [maxPages, setMaxPages] = useState<number>(25);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [waitForDynamic, setWaitForDynamic] = useState<boolean>(true);
  const [followInternalOnly, setFollowInternalOnly] = useState<boolean>(true);
  const [touched, setTouched] = useState<boolean>(false);

  // Validation d'URL
  const validateUrl = (value: string): { isValid: boolean; message: string } => {
    if (!value.trim()) {
      return { isValid: false, message: "Veuillez saisir ou coller l'URL du site à extraire." };
    }
    try {
      const parsed = new URL(value.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { isValid: false, message: 'Le protocole doit obligatoirement être http:// ou https://' };
      }
      if (!parsed.hostname.includes('.')) {
        return { isValid: false, message: 'Nom de domaine invalide (ex: exemple.com)' };
      }
      if (
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.startsWith('192.168.')
      ) {
        return { isValid: false, message: 'Sécurité : Les adresses privées et locales sont interdites.' };
      }
      return { isValid: true, message: 'URL valide et prête à être explorée.' };
    } catch {
      return { isValid: false, message: 'Format d’URL invalide (ex: https://mon-site.com/docs)' };
    }
  };

  const validation = validateUrl(url);

  // Action coller depuis le presse-papier
  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          setTouched(true);
        }
      }
    } catch {
      // Si la permission est refusée par le navigateur
      const input = document.getElementById('input-url') as HTMLInputElement | null;
      input?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!validation.isValid || isLoading) return;

    onSubmit({
      url: url.trim(),
      mode,
      maxPages: mode === 'single' ? 1 : Math.min(Math.max(1, maxPages), 100),
      waitForDynamic,
      followInternalOnly,
    });
  };

  return (
    <div className="scrape-hero-card">
      <div className="hero-texts">
        <div className="hero-kicker">
          <span className="kicker-dot" />
          <span>MOTEUR D'EXTRACTION INTELLIGENT</span>
        </div>
        <h1 className="hero-title">Extraire et structurer le Web</h1>
      </div>

      <form onSubmit={handleSubmit} className="hero-form">
        {/* Champ URL avec bouton Coller intégré */}
        <div className="url-bar-container">
          <div className="url-input-box">
            <span className="url-prefix-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </span>
            <input
              id="input-url"
              type="text"
              className="url-native-input"
              placeholder="https://exemple.com/documentation"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTouched(true);
              }}
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="button"
              className="btn-paste"
              onClick={handlePaste}
              title="Coller depuis le presse-papier"
              id="btn-paste-clipboard"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              <span>Coller</span>
            </button>
          </div>

          {touched && !validation.isValid && (
            <div className="inline-feedback error-feedback">
              <span>⚠️ {validation.message}</span>
            </div>
          )}
        </div>

        {/* Sélecteur de portée (Scope pills) */}
        <div className="scope-pills-row">
          <button
            type="button"
            className={`scope-pill ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
            id="pill-single-page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Cette page seule</span>
          </button>

          <button
            type="button"
            className={`scope-pill ${mode === 'crawl' ? 'active' : ''}`}
            onClick={() => setMode('crawl')}
            id="pill-crawl-site"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="6" height="6" rx="1"></rect>
              <rect x="16" y="3" width="6" height="6" rx="1"></rect>
              <rect x="9" y="15" width="6" height="6" rx="1"></rect>
              <path d="M5 9v3a2 2 0 0 0 2 2h5"></path>
              <path d="M19 9v3a2 2 0 0 1-2 2h-5"></path>
            </svg>
            <span>Tout le site (Crawl)</span>
          </button>

          <button
            type="button"
            className={`scope-pill pill-subtle ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
            id="pill-advanced-toggle"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Avancé...</span>
          </button>
        </div>

        {/* Panneau de réglage dynamique si mode Crawl ou Avancé activé */}
        {(mode === 'crawl' || showAdvanced) && (
          <div className="advanced-crawl-panel fade-in">
            {mode === 'crawl' && (
              <div className="crawl-slider-group">
                <div className="slider-label-row">
                  <span className="slider-label">Nombre de pages maximum :</span>
                  <span className="slider-value-badge">{maxPages} pages</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value, 10))}
                  className="native-range-slider"
                  id="input-max-pages"
                />
                <div className="slider-ticks-row">
                  <span>1 page</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100 max</span>
                </div>
              </div>
            )}

            {showAdvanced && (
              <div className="advanced-toggles-row">
                <label className="checkbox-item" htmlFor="chk-dynamic">
                  <input
                    id="chk-dynamic"
                    type="checkbox"
                    checked={waitForDynamic}
                    onChange={(e) => setWaitForDynamic(e.target.checked)}
                  />
                  <span>Rendu JavaScript dynamique (React/Next.js)</span>
                </label>
                <label className="checkbox-item" htmlFor="chk-internal">
                  <input
                    id="chk-internal"
                    type="checkbox"
                    checked={followInternalOnly}
                    onChange={(e) => setFollowInternalOnly(e.target.checked)}
                  />
                  <span>Confinement au même domaine</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Gros bouton d'action principal */}
        <button
          type="submit"
          className="btn-main-action"
          disabled={!validation.isValid || isLoading}
          id="btn-start-scraping"
        >
          {isLoading ? (
            <>
              <span className="btn-spinner" />
              <span>Exploration en cours...</span>
            </>
          ) : (
            <>
              <span>Lancer le scraping</span>
              <span className="btn-arrow-icon">→</span>
            </>
          )}
        </button>
      </form>

      <div className="hero-card-footer">
        <span className="footer-feature-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Nettoyage HTML
        </span>
        <span className="footer-feature-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Rendu JS Playwright
        </span>
        <span className="footer-feature-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Exports PDF &amp; JSON
        </span>
      </div>
    </div>
  );
};
