// En production, si VITE_API_BASE_URL n'est pas défini, on utilise une URL relative ('')
// qui permet au reverse proxy (Nginx ou PaaS) d'acheminer /api vers le backend sans problème de CORS.
// En développement local direct, on utilise http://localhost:3001 par défaut.
const isDev = import.meta.env.DEV;
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || (isDev ? 'http://localhost:3001' : '');

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  scrape: `${API_BASE_URL}/api/scrape`,
  task: (id: string) => `${API_BASE_URL}/api/tasks/${id}`,
  downloadPdf: (id: string) => `${API_BASE_URL}/api/tasks/${id}/download/pdf`,
  downloadJson: (id: string) => `${API_BASE_URL}/api/tasks/${id}/download/json`,
};
