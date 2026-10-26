import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { validateAndSanitizeUrl } from '../utils/security.js';
import { taskManager } from '../services/taskManager.js';
import { executeScrapingJob } from '../services/scraperClient.js';
import { ScrapeRequestBody } from '../types';

/**
 * POST /api/scrape
 * Crée et met en file d'attente une nouvelle tâche de scraping
 */
export async function createScrapeTask(req: Request, res: Response): Promise<void> {
  const body = req.body as ScrapeRequestBody;

  if (!body || typeof body !== 'object') {
    res.status(400).json({
      error: 'INVALID_PAYLOAD',
      message: 'Le corps de la requête JSON est invalide ou absent.',
    });
    return;
  }

  // 1. Validation de l'URL et contrôle de sécurité Anti-SSRF
  const urlCheck = await validateAndSanitizeUrl(body.url);
  if (!urlCheck.isValid || !urlCheck.normalizedUrl || !urlCheck.domain) {
    res.status(400).json({
      error: 'URL_VALIDATION_FAILED',
      message: urlCheck.errorMessage || 'URL invalide ou rejetée par la politique de sécurité.',
    });
    return;
  }

  // 2. Validation du nombre de pages (1 à 100 strict)
  let maxPages = 25;
  if (body.maxPages !== undefined) {
    const parsedMax = Number(body.maxPages);
    if (isNaN(parsedMax) || parsedMax < 1 || parsedMax > 100) {
      res.status(400).json({
        error: 'INVALID_PAGE_LIMIT',
        message: 'Le paramètre maxPages doit être un entier compris entre 1 et 100.',
      });
      return;
    }
    maxPages = Math.floor(parsedMax);
  }

  const waitForDynamic = body.waitForDynamic !== false; // true par défaut
  const followInternalOnly = body.followInternalOnly !== false; // true par défaut

  // 3. Création de la tâche dans le gestionnaire
  const task = taskManager.createTask({
    targetUrl: body.url.trim(),
    normalizedUrl: urlCheck.normalizedUrl,
    domain: urlCheck.domain,
    maxPages,
    waitForDynamic,
    followInternalOnly,
  });

  // 4. Lancement de l'extraction réelle via FastAPI
  executeScrapingJob(task.id);

  res.status(202).json({
    message: "Tâche d'exploration acceptée et mise en file d'attente.",
    taskId: task.id,
    status: task.status,
    config: {
      targetUrl: task.targetUrl,
      domain: task.domain,
      maxPages: task.maxPages,
      waitForDynamic: task.waitForDynamic,
      followInternalOnly: task.followInternalOnly,
    },
    links: {
      status: `/api/tasks/${task.id}`,
      result: `/api/tasks/${task.id}/result`,
    },
    createdAt: task.createdAt,
  });
}

/**
 * GET /api/tasks/:taskId
 * Retourne l'état d'avancement et la télémétrie d'une tâche
 */
export function getTaskStatus(req: Request, res: Response): void {
  const taskId = String(req.params.taskId);
  const task = taskManager.getTask(taskId);

  if (!task) {
    res.status(404).json({
      error: 'TASK_NOT_FOUND',
      message: `Aucune tâche trouvée avec l'identifiant : ${taskId}`,
    });
    return;
  }

  res.status(200).json({
    taskId: task.id,
    status: task.status,
    progress: task.progress,
    currentStep: task.currentStep,
    pagesDiscovered: task.pagesDiscovered,
    pagesProcessed: task.pagesProcessed,
    maxPages: task.maxPages,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    resultSummary: task.resultSummary,
  });
}

/**
 * GET /api/tasks/:taskId/result
 * Retourne le résultat final de l'extraction
 */
export function getTaskResult(req: Request, res: Response): void {
  const taskId = String(req.params.taskId);
  const task = taskManager.getTask(taskId);

  if (!task) {
    res.status(404).json({
      error: 'TASK_NOT_FOUND',
      message: `Aucune tâche trouvée avec l'identifiant : ${taskId}`,
    });
    return;
  }

  if (task.status !== 'completed') {
    res.status(409).json({
      error: 'TASK_NOT_READY',
      message: `La tâche n'est pas encore terminée (statut actuel : ${task.status}).`,
      progress: task.progress,
    });
    return;
  }

  res.status(200).json({
    taskId: task.id,
    targetUrl: task.targetUrl,
    domain: task.domain,
    status: task.status,
    summary: task.resultSummary,
    completedAt: task.updatedAt,
  });
}

/**
 * DELETE /api/tasks/:taskId
 * Annule une tâche active
 */
export function cancelScrapeTask(req: Request, res: Response): void {
  const taskId = String(req.params.taskId);
  const success = taskManager.cancelTask(taskId);

  if (!success) {
    const task = taskManager.getTask(taskId);
    if (!task) {
      res.status(404).json({
        error: 'TASK_NOT_FOUND',
        message: `Aucune tâche trouvée avec l'identifiant : ${taskId}`,
      });
      return;
    }
    res.status(400).json({
      error: 'CANNOT_CANCEL',
      message: `Impossible d'annuler une tâche avec le statut actuel : ${task.status}`,
    });
    return;
  }

  res.status(200).json({
    message: 'Tâche annulée avec succès.',
    taskId,
    status: 'cancelled',
  });
}

/**
 * GET /api/tasks
 * Liste les tâches enregistrées
 */
export function listTasks(_req: Request, res: Response): void {
  const tasks = taskManager.listTasks().map((t) => ({
    id: t.id,
    targetUrl: t.targetUrl,
    domain: t.domain,
    status: t.status,
    progress: t.progress,
    createdAt: t.createdAt,
  }));

  res.status(200).json({
    count: tasks.length,
    tasks,
  });
}

/**
 * GET /api/tasks/:taskId/download/pdf
 * Télécharge le fichier PDF généré
 */
export function downloadTaskPdf(req: Request, res: Response): void {
  const taskId = String(req.params.taskId);
  const task = taskManager.getTask(taskId);

  // Recherche dans le stockage partagé
  const storagePath = path.resolve(process.cwd(), '..', 'storage', 'results', `${taskId}.pdf`);

  if (!fs.existsSync(storagePath)) {
    res.status(404).json({
      error: 'FILE_NOT_FOUND',
      message: 'Le fichier PDF pour cette extraction est introuvable ou pas encore prêt.',
    });
    return;
  }

  const safeDomain = (task?.domain || 'web').replace(/[^a-zA-Z0-9.-]/g, '_');
  res.download(storagePath, `xamale-${safeDomain}-${taskId.slice(0, 8)}.pdf`);
}

/**
 * GET /api/tasks/:taskId/download/json
 * Télécharge le fichier JSON structuré généré
 */
export function downloadTaskJson(req: Request, res: Response): void {
  const taskId = String(req.params.taskId);
  const task = taskManager.getTask(taskId);

  // Recherche dans le stockage partagé
  const storagePath = path.resolve(process.cwd(), '..', 'storage', 'results', `${taskId}.json`);

  if (!fs.existsSync(storagePath)) {
    res.status(404).json({
      error: 'FILE_NOT_FOUND',
      message: 'Le fichier JSON pour cette extraction est introuvable ou pas encore prêt.',
    });
    return;
  }

  const safeDomain = (task?.domain || 'web').replace(/[^a-zA-Z0-9.-]/g, '_');
  res.download(storagePath, `xamale-${safeDomain}-${taskId.slice(0, 8)}.json`);
}
