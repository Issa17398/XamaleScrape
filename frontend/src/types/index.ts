export interface ScrapeConfig {
  url: string;
  maxPages: number;
  waitForDynamic: boolean;
  followInternalOnly: boolean;
  mode: 'single' | 'crawl';
}

export interface ExtractedPagePreview {
  url: string;
  title: string;
  characterCount: number;
  headingsCount: number;
  paragraphsCount: number;
  sampleText: string;
}

export interface ScrapeJobSummary {
  taskId: string;
  targetDomain: string;
  totalPages: number;
  totalWords: number;
  durationSeconds: number;
  pages: ExtractedPagePreview[];
  pdfUrl?: string;
  jsonUrl?: string;
  isDemoData: boolean;
}

export type TaskStatus = 'idle' | 'validating' | 'running' | 'success' | 'error';

export interface ProgressState {
  percentage: number;
  currentStep: string;
  pagesFound: number;
  pagesProcessed: number;
  maxPages: number;
  logs: string[];
}

export interface RecentExtraction {
  id: string;
  domain: string;
  url: string;
  status: 'Terminé' | 'En cours' | 'Erreur';
  pagesCount: number;
  sizeKb: number;
  wordCount: number;
  timeAgo: string;
  createdAt: string;
}
