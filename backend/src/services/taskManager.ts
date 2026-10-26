import { randomUUID } from 'crypto';
import { ScrapeTask, TaskStatus } from '../types';

class TaskManager {
  private tasks: Map<string, ScrapeTask> = new Map();

  /**
   * Crée une nouvelle tâche d'exploration et l'enregistre dans le magasin en mémoire
   */
  public createTask(params: {
    targetUrl: string;
    normalizedUrl: string;
    domain: string;
    maxPages: number;
    waitForDynamic: boolean;
    followInternalOnly: boolean;
  }): ScrapeTask {
    const taskId = randomUUID();
    const now = new Date().toISOString();

    const task: ScrapeTask = {
      id: taskId,
      targetUrl: params.targetUrl,
      normalizedUrl: params.normalizedUrl,
      domain: params.domain,
      maxPages: params.maxPages,
      waitForDynamic: params.waitForDynamic,
      followInternalOnly: params.followInternalOnly,
      status: 'queued',
      progress: 0,
      currentStep: 'Tâche en attente dans la file...',
      pagesDiscovered: 1,
      pagesProcessed: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(taskId, task);
    this.cleanupOldTasks();
    return task;
  }

  /**
   * Récupère une tâche par son identifiant unique
   */
  public getTask(taskId: string): ScrapeTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Met à jour une tâche
   */
  public updateTask(
    taskId: string,
    updates: Partial<Omit<ScrapeTask, 'id' | 'createdAt'>>
  ): ScrapeTask | undefined {
    const existing = this.tasks.get(taskId);
    if (!existing) return undefined;

    const updated: ScrapeTask = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(taskId, updated);
    return updated;
  }

  /**
   * Annule une tâche active
   */
  public cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === 'completed' || task.status === 'failed') {
      return false;
    }

    this.updateTask(taskId, {
      status: 'cancelled',
      currentStep: 'Tâche interrompue par l’utilisateur.',
    });
    return true;
  }

  /**
   * Liste toutes les tâches actuelles
   */
  public listTasks(): ScrapeTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Nettoyage automatique des tâches terminées de plus de 2 heures
   */
  private cleanupOldTasks(): void {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, task] of this.tasks.entries()) {
      const createdTime = new Date(task.createdAt).getTime();
      if (createdTime < twoHoursAgo) {
        this.tasks.delete(id);
      }
    }
  }
}

export const taskManager = new TaskManager();
