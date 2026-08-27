import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

type AppConfig = {
  webOrigin: string;
};

export function createApp({ webOrigin }: AppConfig) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());

  app.use(cors({ origin: webOrigin }));

  app.get('/api', (req, res) => {
    res.send({ message: 'Welcome to api!' });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return app;
}
