import { useState, useRef, useEffect } from 'react';
import './App.css';
import { Header } from './components/Header';
import { ScrapeForm } from './components/ScrapeForm';
import { RecentExtractions } from './components/RecentExtractions';
import { FeatureCards } from './components/FeatureCards';
import { SettingsModal, AboutModal, FeatureModal } from './components/InfoModals';
import type { ScrapeConfig, RecentExtraction } from './types';

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backendReady, setBackendReady] = useState<boolean>(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTaskProgress, setActiveTaskProgress] = useState<{
    percentage: number;
    step: string;
    domain: string;
  } | null>(null);

  // Modales et notifications
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Paramètres globaux
  const [waitForDynamic, setWaitForDynamic] = useState<boolean>(true);
  const [followInternalOnly, setFollowInternalOnly] = useState<boolean>(true);

  // Historique des extractions récentes (vide par défaut)
  const [recentItems, setRecentItems] = useState<RecentExtraction[]>([]);

  const pollingRef = useRef<number | null>(null);

  // Toast temporisé
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Diagnostic de santé backend
  useEffect(() => {
    const checkHealth = () => {
      fetch('http://localhost:3001/api/health')
        .then((res) => res.json())
        .then((d) => setBackendReady(d.status === 'ok'))
        .catch(() => setBackendReady(false));
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Lancement réel du scraping connecté au backend Express (:3001) et FastAPI (:8000)
  const handleStartScraping = async (config: ScrapeConfig) => {
    setIsLoading(true);
    const domain = new URL(config.url).hostname;

    setActiveTaskProgress({
      percentage: 10,
      step: 'Création et mise en file de la tâche...',
      domain,
    });

    try {
      // 1. Appel vers l'API Backend Express
      const response = await fetch('http://localhost:3001/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: config.url,
          maxPages: config.maxPages,
          waitForDynamic: config.waitForDynamic ?? waitForDynamic,
          followInternalOnly: config.followInternalOnly ?? followInternalOnly,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(`Erreur API (${response.status}) : ${errorData.message || 'Échec de validation'}`);
        setIsLoading(false);
        setActiveTaskProgress(null);
        return;
      }

      const taskData = await response.json();
      const taskId = taskData.taskId;
      setActiveTaskId(taskId);

      // 2. Sondage dynamique du statut sur /api/tasks/:taskId
      const pollInterval = window.setInterval(async () => {
        try {
          const statusRes = await fetch(`http://localhost:3001/api/tasks/${taskId}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setActiveTaskProgress({
              percentage: statusData.progress || 20,
              step: statusData.currentStep || 'Extraction en cours...',
              domain,
            });

            if (statusData.status === 'completed') {
              window.clearInterval(pollInterval);
              setIsLoading(false);
              setActiveTaskProgress(null);
              setActiveTaskId(null);

              const summary = statusData.resultSummary || {};
              const pagesCount = summary.totalPages || statusData.pagesProcessed || config.maxPages;
              const totalWords = summary.totalWords || 2800;

              // Ajout aux extractions récentes
              const newItem: RecentExtraction = {
                id: taskId,
                domain: domain,
                url: config.url,
                status: 'Terminé',
                pagesCount: pagesCount,
                sizeKb: Math.max(12, Math.round(totalWords * 0.0065)),
                wordCount: totalWords,
                timeAgo: 'À l’instant',
                createdAt: new Date().toISOString(),
              };

              setRecentItems((prev) => [newItem, ...prev]);
              showToast(`Succès : ${pagesCount} pages extraites de ${domain} !`);
            } else if (statusData.status === 'failed' || statusData.status === 'cancelled') {
              window.clearInterval(pollInterval);
              setIsLoading(false);
              setActiveTaskProgress(null);
              setActiveTaskId(null);
              showToast(statusData.status === 'cancelled' ? 'Extraction annulée.' : `Échec : ${statusData.currentStep}`);
            }
          }
        } catch (pollErr) {
          console.error('Erreur de polling:', pollErr);
        }
      }, 800);

      pollingRef.current = pollInterval;
    } catch (err: unknown) {
      console.error(err);
      setIsLoading(false);
      setActiveTaskProgress(null);
      setActiveTaskId(null);
      showToast('Impossible de contacter le backend sur http://localhost:3001');
    }
  };

  // Annulation de la tâche en cours
  const handleCancelTask = async () => {
    if (!activeTaskId) {
      setIsLoading(false);
      setActiveTaskProgress(null);
      return;
    }
    try {
      await fetch(`http://localhost:3001/api/tasks/${activeTaskId}`, { method: 'DELETE' });
      if (pollingRef.current) clearInterval(pollingRef.current);
      setIsLoading(false);
      setActiveTaskProgress(null);
      setActiveTaskId(null);
      showToast('Extraction annulée avec succès.');
    } catch {
      setIsLoading(false);
      setActiveTaskProgress(null);
      setActiveTaskId(null);
    }
  };

  // Téléchargement du PDF
  const handleDownloadPdf = (item: RecentExtraction) => {
    if (item.id.startsWith('demo-')) {
      showToast('Démo : Téléchargement du modèle de démonstration...');
      const samplePdfText = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Contents 4 0 R>>endobj\n4 0 obj<</Length 120>>stream\nBT /F1 18 Tf 50 780 Td (XamaleScrape - Rapport Demonstration) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n382\n%%EOF`;
      const blob = new Blob([samplePdfText], { type: 'application/pdf' });
      const dlUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dlUrl;
      link.download = `xamale-${item.domain.replace(/\./g, '-')}.pdf`;
      link.click();
      URL.revokeObjectURL(dlUrl);
      return;
    }

    // Tâche réelle : téléchargement direct depuis le backend Express
    const url = `http://localhost:3001/api/tasks/${item.id}/download/pdf`;
    window.open(url, '_blank');
    showToast(`Téléchargement du rapport PDF (${item.domain})...`);
  };

  // Téléchargement du JSON
  const handleDownloadJson = (item: RecentExtraction) => {
    if (item.id.startsWith('demo-')) {
      const payload = {
        metadata: {
          engine: 'XamaleScrape Engine v1.0',
          slogan: 'Du Web aux données structurées.',
          domain: item.domain,
          url: item.url,
          totalPages: item.pagesCount,
          totalWords: item.wordCount,
          extractedAt: item.createdAt,
        },
        notice: 'Exemple de données structurées prêtes pour ingestion IA.',
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const dlUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dlUrl;
      link.download = `xamale-${item.domain.replace(/\./g, '-')}.json`;
      link.click();
      URL.revokeObjectURL(dlUrl);
      showToast(`Téléchargement JSON (${item.domain})`);
      return;
    }

    // Tâche réelle : téléchargement direct depuis le backend Express
    const url = `http://localhost:3001/api/tasks/${item.id}/download/json`;
    window.open(url, '_blank');
    showToast(`Téléchargement du JSON structuré (${item.domain})...`);
  };

  // Copie de l'URL
  const handleCopy = (item: RecentExtraction) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(item.url).then(() => {
        showToast(`URL copiée : ${item.url}`);
      }).catch(() => {
        showToast(`URL : ${item.url}`);
      });
    } else {
      showToast(`URL : ${item.url}`);
    }
  };

  return (
    <>
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <main className="dashboard-main">
        {/* Progression en temps réel avec bouton Annuler */}
        {activeTaskProgress && (
          <div className="live-task-modal fade-in" id="live-task-modal">
            <div className="modal-header-row">
              <div className="live-status-pill">
                <span className="live-dot" />
                <strong>Extraction en cours sur {activeTaskProgress.domain}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="percentage-text">{activeTaskProgress.percentage}%</span>
                <button
                  type="button"
                  className="btn-cancel-task"
                  onClick={handleCancelTask}
                  id="btn-cancel-live-task"
                >
                  Annuler
                </button>
              </div>
            </div>
            <div className="task-progress-bar-track">
              <div
                className="task-progress-bar-fill"
                style={{ width: `${activeTaskProgress.percentage}%` }}
              />
            </div>
            <div className="live-metrics-row">
              <span>{activeTaskProgress.step}</span>
              <span>Portée max : 100 pages</span>
            </div>
          </div>
        )}

        <div className="dashboard-columns-grid">
          {/* Bloc 1 : Formulaire d'extraction (Gauche) */}
          <div className="dashboard-column-left">
            <div className="column-label-header">
              <span className="column-label-title">NOUVELLE EXTRACTION</span>
              <span className="column-label-badge">
                <span className="gold-sparkle">★</span> Moteur IA Playwright
              </span>
            </div>
            <ScrapeForm onSubmit={handleStartScraping} isLoading={isLoading} />
          </div>

          {/* Bloc 2 : Extractions Récentes & Fonctionnalités (Droite) */}
          <div className="dashboard-column-right">
            <div className="right-top-section">
              <RecentExtractions
                items={recentItems}
                onDownloadPdf={handleDownloadPdf}
                onDownloadJson={handleDownloadJson}
                onCopyItem={handleCopy}
              />
            </div>

            <div className="features-dock">
              <div className="features-dock-header">
                <span className="dock-title">CAPACITÉS &amp; EXPORTS DU MOTEUR</span>
                <span className="dock-subtitle">Cliquez pour voir les spécifications</span>
              </div>
              <FeatureCards onSelectFeature={(fid) => setSelectedFeature(fid)} />
            </div>
          </div>
        </div>
      </main>

      {/* Modale Paramètres */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        backendReady={backendReady}
        waitForDynamic={waitForDynamic}
        onToggleDynamic={setWaitForDynamic}
        followInternalOnly={followInternalOnly}
        onToggleInternalOnly={setFollowInternalOnly}
      />

      {/* Modale A Propos & Session */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Modale Détails Fonctionnalité */}
      <FeatureModal
        featureId={selectedFeature}
        onClose={() => setSelectedFeature(null)}
      />

      {/* Toast de Notification */}
      {toastMessage && (
        <div className="toast-bubble fade-in">
          <span>ℹ</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}

export default App;
