import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getCurrentUser } from '../features/authentication/authentication-api';
import { ApiError } from '../lib/api-error';
import type { AuthenticatedUser } from '../types/authentication';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

type SessionContextValue = {
  user: AuthenticatedUser | null;
  status: SessionStatus;
  setAuthenticatedUser: (user: AuthenticatedUser) => void;
  clearSession: () => void;
  reloadSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  async function reloadSession() {
    setStatus('loading');
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setStatus('authenticated');
    } catch (error) {
      setUser(null);
      setStatus(
        error instanceof ApiError && error.status !== 401
          ? 'error'
          : 'unauthenticated',
      );
    }
  }

  useEffect(() => {
    void reloadSession();
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      status,
      setAuthenticatedUser(nextUser) {
        setUser(nextUser);
        setStatus('authenticated');
      },
      clearSession() {
        setUser(null);
        setStatus('unauthenticated');
      },
      reloadSession,
    }),
    [status, user],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return session;
}
