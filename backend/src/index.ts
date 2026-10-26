import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Montage du routeur API
app.use('/api', apiRouter);

// Gestionnaire des routes inconnues (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `La ressource demandée '${req.method} ${req.path}' n'existe pas.`,
  });
});

// Middleware global de traitement des erreurs (500)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Backend Error]', err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Une erreur imprévue est survenue sur le serveur.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`[Backend] Serveur Express en écoute sur http://localhost:${PORT}`);
});

export default app;
