import express from 'express';
import cors from 'cors';
import { authMiddleware } from './auth';
import routes from './routes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api', authMiddleware);
  app.use('/api', routes);

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      status: err.status || 500
    });
  });

  return app;
}
