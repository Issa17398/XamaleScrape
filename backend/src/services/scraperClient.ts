import { taskManager } from './taskManager.js';

const FASTAPI_URL = process.env.SCRAPER_SERVICE_URL || 'http://127.0.0.1:8000';

interface FastApiCrawlResponse {
  task_id: string;
  domain: string;
  status: string;
  summary: {
    total_pages: number;
    total_words: number;
    duration_seconds: number;
  };
  pages: Array<{
    url: string;
    title: string;
    word_count: number;
    headings: string[];
    text_content: string;
  }>;
  pdf_filename?: string;
  json_filename?: string;
}

/**
 * Lance l'extraction asynchrone auprès du service FastAPI
 */
export async function executeScrapingJob(taskId: string): Promise<void> {
  const task = taskManager.getTask(taskId);
  if (!task) return;

  // Mise à jour de l'état : En cours
  taskManager.updateTask(taskId, {
    status: 'running',
    progress: 15,
    currentStep: `Connexion au domaine ${task.domain}...`,
    pagesDiscovered: 1,
    pagesProcessed: 0,
  });

  // Progression intermédiaire visuelle
  const progressTimer = setInterval(() => {
    const current = taskManager.getTask(taskId);
    if (!current || current.status !== 'running') {
      clearInterval(progressTimer);
      return;
    }
    if (current.progress < 85) {
      taskManager.updateTask(taskId, {
        progress: Math.min(85, current.progress + 15),
        currentStep: `Exploration des pages et structuration des données sur ${current.domain}...`,
      });
    }
  }, 1200);

  try {
    const response = await fetch(`${FASTAPI_URL}/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_id: taskId,
        url: task.targetUrl,
        max_pages: task.maxPages,
        wait_for_dynamic: task.waitForDynamic,
        follow_internal_only: task.followInternalOnly,
      }),
    });

    clearInterval(progressTimer);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.detail || `Échec du service Scraper (${response.status})`;
      taskManager.updateTask(taskId, {
        status: 'failed',
        progress: 100,
        currentStep: `Erreur : ${errorMsg}`,
      });
      return;
    }

    const data = (await response.json()) as FastApiCrawlResponse;

    taskManager.updateTask(taskId, {
      status: 'completed',
      progress: 100,
      currentStep: 'Extraction et structuration terminées avec succès.',
      pagesProcessed: data.summary.total_pages,
      pagesDiscovered: data.summary.total_pages,
      resultSummary: {
        totalPages: data.summary.total_pages,
        totalWords: data.summary.total_words,
        durationSeconds: data.summary.duration_seconds,
      },
    });
  } catch (err: unknown) {
    clearInterval(progressTimer);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ScraperClient] Erreur sur la tâche ${taskId}:`, msg);
    taskManager.updateTask(taskId, {
      status: 'failed',
      progress: 100,
      currentStep: `Erreur de communication avec le moteur d'extraction : ${msg}`,
    });
  }
}
