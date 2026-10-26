import React from 'react';
import type { RecentExtraction } from '../types';

interface RecentExtractionsProps {
  items: RecentExtraction[];
  onDownloadPdf?: (item: RecentExtraction) => void;
  onDownloadJson?: (item: RecentExtraction) => void;
  onCopyItem?: (item: RecentExtraction) => void;
}

export const RecentExtractions: React.FC<RecentExtractionsProps> = ({
  items,
  onDownloadPdf,
  onDownloadJson,
  onCopyItem,
}) => {
  return (
    <div className="recent-extractions-section">
      <div className="section-header-row">
        <h2 className="recent-title">EXTRACTIONS RÉCENTES</h2>
        <div className="live-status-pill">
          <span className="live-dot" />
          <span>En direct</span>
        </div>
      </div>

      <div className="recent-list">
        {items.length === 0 ? (
          <div className="recent-empty-state">
            <div className="empty-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p className="empty-title">Aucune extraction récente</p>
            <p className="empty-sub">Collez une URL dans le formulaire à gauche pour extraire vos premières données.</p>
          </div>
        ) : (
          items.map((item) => (
          <div key={item.id} className="recent-card fade-in" id={`recent-${item.id}`}>
            <div className="recent-card-left">
              <div className="recent-type-icon">
                <span>{'{ }'}</span>
              </div>
              <div className="recent-info">
                <div className="recent-title-row">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="recent-link"
                  >
                    {item.domain}
                  </a>
                  <span className={`badge-status ${item.status === 'Terminé' ? 'badge-done' : ''}`}>
                    {item.status}
                  </span>
                </div>
                <p className="recent-stats-line">
                  {item.pagesCount} {item.pagesCount > 1 ? 'pages scrapées' : 'page scrapée'} · {item.sizeKb} Ko de texte
                </p>
                <div className="recent-meta-footer">
                  <span className="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    <span>{item.wordCount.toLocaleString('fr-FR')} mots</span>
                  </span>
                  <span className="meta-separator">•</span>
                  <span className="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{item.timeAgo}</span>
                  </span>
                  <span className="format-ready-tag">PDF &amp; JSON prêts</span>
                </div>
              </div>
            </div>

            <div className="recent-card-actions">
              <button
                type="button"
                className="btn-format-download btn-download-pdf"
                onClick={() => onDownloadPdf?.(item)}
                title="Télécharger le rapport PDF officiel"
                id={`btn-download-pdf-${item.id}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <polyline points="9 15 12 18 15 15"></polyline>
                </svg>
                <span>PDF</span>
              </button>

              <button
                type="button"
                className="btn-format-download btn-download-json"
                onClick={() => onDownloadJson?.(item)}
                title="Télécharger les données JSON structurées"
                id={`btn-download-json-${item.id}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>JSON</span>
              </button>

              <button
                type="button"
                className="action-circle-btn"
                onClick={() => onCopyItem?.(item)}
                title="Copier l'URL dans le presse-papier"
                id={`btn-copy-${item.id}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
};
