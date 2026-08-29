import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  createRegistrationRouter,
  type RegisterUser,
} from './auth/registration-router';
import type { LoginUser } from './auth/login-service';
import type { AuthenticateSession, LogoutUser } from './auth/session-service';

type AppConfig = {
  webOrigin: string;
  checkDatabase: () => Promise<void>;
  registerUser: RegisterUser;
  loginUser?: LoginUser;
  authenticateSession?: AuthenticateSession;
  logoutUser?: LogoutUser;
  secureCookies?: boolean;
};

export function createApp({
  webOrigin,
  checkDatabase,
  registerUser,
}: AppConfig) {
  const app = express();

  //API Hardening:
  app.disable('x-powered-by');
  app.use(helmet());

  app.use(cors({ origin: webOrigin }));

  app.use(express.json({ limit: '10kb' }));

  //Routes:
  app.use('/auth', createRegistrationRouter({ registerUser }));

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
