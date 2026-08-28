import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { RegisterUser } from './auth/registration-router';

type AppConfig = {
  webOrigin: string;
  checkDatabase: () => Promise<void>;
  registerUser?: RegisterUser;
};

export function createApp({ webOrigin, checkDatabase }: AppConfig) {
  const app = express();

  //API Hardening:
  app.disable('x-powered-by');
  app.use(helmet());

  app.use(cors({ origin: webOrigin }));

  app.use(express.json({ limit: '10kb' }));

  //Routes:
  app.get('/api', (req, res) => {
    res.send({ message: 'Welcome to api!' });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/ready', async (_req, res) => {
    try {
      await checkDatabase();
      res.status(200).json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not_ready' });
    }
  });

  return app;
}
