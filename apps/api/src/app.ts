import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import {
  createRegistrationRouter,
  type RegisterUser,
} from './auth/registration/registration-router';
import type { LoginUser } from './auth/login/login-service';
import type {
  AuthenticateSession,
  LogoutUser,
} from './auth/session/session-service';
import { createProfileRouter } from './auth/profile/profile-router';
import type { UpdateProfile } from './auth/profile/profile-service';
import {
  CSRF_HEADER_NAME,
  createSessionRouter,
} from './auth/session/session-router';
import {
  createLinkRouter,
  type CreateOwnedLink,
  type DeleteOwnedLink,
  type ListOwnedLinks,
} from './links/management/link-router';
import { createRedirectRouter } from './links/redirect/redirect-router';
import type { ResolveRedirect } from './links/redirect/redirect-service';

type LinkDependencies = {
  createOwnedLink: CreateOwnedLink;
  listOwnedLinks: ListOwnedLinks;
  deleteOwnedLink: DeleteOwnedLink;
};

type RedirectDependencies = {
  resolveRedirect: ResolveRedirect;
};

type ProfileDependencies = {
  updateProfile: UpdateProfile;
};

type AppConfig = {
  webOrigin: string;
  checkDatabase: () => Promise<void>;
  registerUser: RegisterUser;
  loginUser: LoginUser;
  authenticateSession: AuthenticateSession;
  logoutUser: LogoutUser;
  secureCookies: boolean;
  linkDependencies?: LinkDependencies;
  redirectDependencies?: RedirectDependencies;
  profileDependencies?: ProfileDependencies;
};

export function createApp({
  webOrigin,
  checkDatabase,
  registerUser,
  loginUser,
  authenticateSession,
  logoutUser,
  secureCookies,
  linkDependencies,
  redirectDependencies,
  profileDependencies,
}: AppConfig) {
  const app = express();

  //API Hardening:
  app.disable('x-powered-by');
  app.use(helmet());

  app.use(
    cors({
      origin: webOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', CSRF_HEADER_NAME],
    }),
  );

  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  //Routes:
  app.use('/auth', createRegistrationRouter({ registerUser }));
  app.use(
    '/auth',
    createSessionRouter({
      loginUser,
      authenticateSession,
      logoutUser,
      secureCookies,
    }),
  );
  if (profileDependencies) {
    app.use(
      '/auth',
      createProfileRouter({ authenticateSession, ...profileDependencies }),
    );
  }
  if (linkDependencies) {
    app.use(
      '/links',
      createLinkRouter({ authenticateSession, ...linkDependencies }),
    );
  }
  if (redirectDependencies) {
    app.use('/r', createRedirectRouter(redirectDependencies));
  }

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
