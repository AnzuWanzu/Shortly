import { Router } from 'express';
import type { CookieOptions, Request, Response } from 'express';
import { parse as parseCookieHeader } from 'cookie';
import { rateLimit } from 'express-rate-limit';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
  UnauthenticatedError,
} from '../shared/auth-errors';
import { loginSchema } from '../login/login-schema';
import type { LoginUser } from '../login/login-service';
import type { AuthenticateSession, LogoutUser } from './session-service';

export const SESSION_COOKIE_NAME = 'shortly_session';
export const CSRF_HEADER_NAME = 'x-shortly-csrf';
export const CSRF_HEADER_VALUE = '1';

type SessionRouterDependencies = {
  loginUser: LoginUser;
  authenticateSession: AuthenticateSession;
  logoutUser: LogoutUser;
  secureCookies: boolean;
};

export function createSessionRouter(dependencies: SessionRouterDependencies) {
  const router = Router();
  const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: {
        code: 'TOO_MANY_LOGIN_ATTEMPTS',
        message: 'Too many login attempts. Try again later.',
      },
    },
  });
  const sessionRateLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: dependencies.secureCookies,
    path: '/',
  };

  router.post(
    '/login',
    loginRateLimit,
    requireCsrfHeader,
    async (request, response) => {
      const parsedInput = loginSchema.safeParse(request.body);

      if (!parsedInput.success) {
        response.status(400).json({
          error: {
            code: 'INVALID_LOGIN_INPUT',
            message: 'Login data is invalid',
            issues: parsedInput.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      try {
        const result = await dependencies.loginUser(parsedInput.data);

        response.cookie(SESSION_COOKIE_NAME, result.token, {
          ...cookieOptions,
          expires: result.expiresAt,
        });
        response.status(200).json({ user: result.user });
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          response.status(401).json({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: error.message,
            },
          });
          return;
        }

        if (error instanceof EmailNotVerifiedError) {
          response.status(403).json({
            error: {
              code: 'EMAIL_NOT_VERIFIED',
              message: error.message,
            },
          });
          return;
        }

        response.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Unable to log in',
          },
        });
      }
    },
  );

  router.get('/me', sessionRateLimit, async (request, response) => {
    try {
      const user = await dependencies.authenticateSession(
        readSessionCookie(request),
      );
      response.status(200).json({ user });
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        response.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: error.message,
          },
        });
        return;
      }

      response.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unable to authenticate session',
        },
      });
    }
  });

  router.post(
    '/logout',
    sessionRateLimit,
    requireCsrfHeader,
    async (request, response) => {
      try {
        await dependencies.logoutUser(readSessionCookie(request));
        response.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
        response.status(204).send();
      } catch {
        response.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Unable to log out',
          },
        });
      }
    },
  );

  return router;
}

export function requireCsrfHeader(
  request: Request,
  response: Response,
  next: () => void,
) {
  if (request.get(CSRF_HEADER_NAME) !== CSRF_HEADER_VALUE) {
    response.status(403).json({
      error: {
        code: 'CSRF_HEADER_REQUIRED',
        message: 'The required request verification header is missing',
      },
    });
    return;
  }

  next();
}

export function readSessionCookie(request: Request): string | undefined {
  const cookies = parseCookieHeader(request.headers.cookie ?? '');
  return cookies[SESSION_COOKIE_NAME];
}
