import { Navigate, useNavigate } from 'react-router';

import { useSession } from '../../app/session-provider';
import { AccountPanel } from './account-panel';
import { ProfileForm } from './profile-form';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, setAuthenticatedUser, clearSession } = useSession();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">
        Account
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink">
        Settings
      </h1>
      <div className="mt-8">
        <ProfileForm user={user} onUpdated={setAuthenticatedUser} />
        <AccountPanel
          onLoggedOut={() => {
            clearSession();
            navigate('/login', { replace: true });
          }}
        />
      </div>
    </section>
  );
}
