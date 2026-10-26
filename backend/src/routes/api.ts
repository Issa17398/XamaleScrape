import { Router, Request, Response } from 'express';
import {
  createScrapeTask,
  getTaskStatus,
  getTaskResult,
  cancelScrapeTask,
  listTasks,
  downloadTaskPdf,
  downloadTaskJson,
} from '../controllers/taskController.js';

const router = Router();

// Route de diagnostic
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'web-to-pdf-backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Routes de gestion des tâches
router.post('/scrape', createScrapeTask);
router.get('/tasks', listTasks);
router.get('/tasks/:taskId', getTaskStatus);
router.get('/tasks/:taskId/result', getTaskResult);
router.get('/tasks/:taskId/download/pdf', downloadTaskPdf);
router.get('/tasks/:taskId/download/json', downloadTaskJson);
router.delete('/tasks/:taskId', cancelScrapeTask);

export default router;
