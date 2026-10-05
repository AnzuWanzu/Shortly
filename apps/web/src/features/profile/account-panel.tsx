import { LoaderCircle, LogOut } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../../components/ui/button';
import { StatusMessage } from '../../components/ui/status-message';
import { ApiError } from '../../lib/api-error';
import { logout } from '../authentication/authentication-api';

export function AccountPanel({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submitLogout() {
    setSubmitting(true);
    setError('');
    try {
      await logout();
      onLoggedOut();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not log out. Try again.',
      );
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-6 border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">Session</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Log out on this device and return to the login screen.
      </p>
      {error ? (
        <div className="mt-4 max-w-xl">
          <StatusMessage tone="error" title="Logout failed">
            {error}
          </StatusMessage>
        </div>
      ) : null}
      <Button
        variant="secondary"
        className="mt-5"
        onClick={() => void submitLogout()}
        disabled={submitting}
      >
        {submitting ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <LogOut className="size-4" aria-hidden />
        )}
        {submitting ? 'Logging out' : 'Log out'}
      </Button>
    </section>
  );
}
