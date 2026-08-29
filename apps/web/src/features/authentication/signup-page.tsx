import { Link } from 'react-router';

import { AuthLayout } from '../../components/layout/auth-layout';

export function SignupPage() {
  return (
    <AuthLayout>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">
        New workspace
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink">
        Create your account
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Start shortening and managing the links you use most.
      </p>
      <p className="mt-8 text-sm text-muted">
        Already registered?{' '}
        <Link className="font-semibold text-violet hover:underline" to="/login">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
