import { Navigate, Outlet, useLocation } from 'react-router';

import { LoadingState } from '../components/ui/loading-state';
import { StatusMessage } from '../components/ui/status-message';
import { useSession } from './session-provider';

export function ProtectedRoute() {
  const location = useLocation();
  const { status } = useSession();

  if (status === 'loading') {
    return <LoadingState label="Restoring your session" />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status === 'error') {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <StatusMessage tone="error" title="Shortly could not start">
          Check that the API is running, then refresh this page.
        </StatusMessage>
      </main>
    );
  }

  return <Outlet />;
}
