import React from 'react';
import type { ScrapeJobSummary } from '../types';

interface ResultsPreviewProps {
  results: ScrapeJobSummary;
  onReset: () => void;
}

export const ResultsPreview: React.FC<ResultsPreviewProps> = ({ results, onReset }) => {
  // Génération d'un téléchargement JSON local pour tester l'export
  const handleDownloadTestJson = () => {
    const jsonBlob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `web-to-pdf-test-${results.taskId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Notification pour le test du PDF
  const handleDownloadTestPdf = () => {
    alert(
      "[MODE TEST ÉTAPE 2]\n\nLe moteur de génération PDF par Chromium sera implémenté et connecté à l'Étape 10.\nL'interface et ses déclencheurs de téléchargement sont d'ores et déjà validés !"
    );
  };

  return (
    <div className="card results-card fade-in" id="results-preview-container">
      {/* Bannière de transparence obligatoire */}
      <div className="demo-notice-banner" id="banner-demo-notice">
        <span className="notice-icon">⚠️</span>
        <div>
          <strong>MODE TEST — VALIDATION DE L'INTERFACE (ÉTAPE 2)</strong>
          <p>
            Ces données illustrent la mise en page, la pagination et les déclencheurs de téléchargement de l'interface. 
            Le moteur réel de scraping (Crawl4AI) sera connecté aux étapes 4 à 8.
          </p>
        </div>
      </div>

      <div className="results-header">
        <div>
          <h2 className="card-title">Résultats de l'analyse</h2>
          <p className="card-description">
            Site exploré : <code className="domain-pill">{results.targetDomain}</code> • Tâche : <code>{results.taskId}</code>
          </p>
        </div>

        <div className="results-actions">
          <button
            type="button"
            className="btn-download btn-pdf"
            onClick={handleDownloadTestPdf}
            id="btn-download-pdf"
          >
            <span>📥 Télécharger le PDF</span>
          </button>
          <button
            type="button"
            className="btn-download btn-json"
            onClick={handleDownloadTestJson}
            id="btn-download-json"
          >
            <span>📄 Télécharger le JSON</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onReset}
            id="btn-new-scrape"
          >
            <span>Nouvelle exploration</span>
          </button>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Pages extraites</span>
          <span className="stat-value">{results.totalPages}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total mots</span>
          <span className="stat-value">{results.totalWords.toLocaleString('fr-FR')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Durée de traitement</span>
          <span className="stat-value">{results.durationSeconds}s</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Conformité intra-domaine</span>
          <span className="stat-value text-green">100%</span>
        </div>
      </div>

      {/* Liste des pages extraites */}
      <div className="pages-list-container">
        <h3 className="section-title">Pages analysées ({results.pages.length})</h3>
        <div className="pages-list">
          {results.pages.map((page, index) => (
            <div key={index} className="page-card" id={`page-card-${index}`}>
              <div className="page-card-header">
                <span className="page-index-badge">#{index + 1}</span>
                <div className="page-title-group">
                  <h4 className="page-title">{page.title}</h4>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="page-url-link"
                  >
                    {page.url} ↗
                  </a>
                </div>
                <div className="page-metrics">
                  <span className="page-metric-pill">{page.headingsCount} titres</span>
                  <span className="page-metric-pill">{page.paragraphsCount} paragraphes</span>
                  <span className="page-metric-pill">{page.characterCount} car.</span>
                </div>
              </div>
              <p className="page-sample-text">« {page.sampleText} »</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
