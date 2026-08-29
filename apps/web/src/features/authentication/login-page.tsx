import { Link, useLocation, useNavigate } from 'react-router';

import { useSession } from '../../app/session-provider';
import { AuthLayout } from '../../components/layout/auth-layout';
import { StatusMessage } from '../../components/ui/status-message';
import { LoginForm } from './login-form';

type LoginLocationState = { message?: string } | null;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthenticatedUser } = useSession();
  const state = location.state as LoginLocationState;

  return (
    <AuthLayout>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">
        Welcome to Shortly
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink">
        Welcome back
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Log in to continue to your link workspace.
      </p>
      {state?.message ? (
        <div className="mt-6">
          <StatusMessage tone="success" title={state.message} />
        </div>
      ) : null}
      <LoginForm
        onAuthenticated={(user) => {
          setAuthenticatedUser(user);
          navigate('/', { replace: true });
        }}
      />
      <p className="mt-8 text-center text-sm text-muted">
        Need an account?{' '}
        <Link
          className="font-semibold text-violet hover:underline"
          to="/signup"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
