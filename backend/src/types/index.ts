export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ScrapeRequestBody {
  url: string;
  maxPages?: number;
  waitForDynamic?: boolean;
  followInternalOnly?: boolean;
}

export interface ExtractedPageResult {
  url: string;
  title: string;
  wordCount: number;
  characterCount: number;
  headings: { level: string; text: string }[];
  paragraphs: string[];
  linksDiscovered: string[];
}

export interface ScrapeTask {
  id: string;
  targetUrl: string;
  normalizedUrl: string;
  domain: string;
  maxPages: number;
  waitForDynamic: boolean;
  followInternalOnly: boolean;
  status: TaskStatus;
  progress: number;
  currentStep: string;
  pagesDiscovered: number;
  pagesProcessed: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
  resultSummary?: {
    totalPages: number;
    totalWords: number;
    durationSeconds: number;
  };
  pages?: ExtractedPageResult[];
}
