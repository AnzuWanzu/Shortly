import { LoaderCircle } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { AuthLayout } from '../../components/layout/auth-layout';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { StatusMessage } from '../../components/ui/status-message';
import { ApiError } from '../../lib/api-error';
import { resendVerification, verifyEmail } from './authentication-api';

type VerificationLocationState = {
  email?: string;
  emailSent?: boolean;
} | null;

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as VerificationLocationState;
  const [email, setEmail] = useState(state?.email ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(
    state?.emailSent === false
      ? 'We could not send the first code. You can request another below.'
      : '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = window.setInterval(
      () => setCooldown((seconds) => Math.max(0, seconds - 1)),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code) || !email) {
      setError('Enter your email and the six-digit code.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await verifyEmail({ email: email.trim().toLowerCase(), code });
      navigate('/login', {
        replace: true,
        state: { message: 'Email verified. You can log in now.' },
      });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to verify the code. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    if (!email || cooldown > 0) return;
    setError('');
    try {
      await resendVerification(email.trim().toLowerCase());
      setMessage('If that account is pending, another code is on its way.');
      setCooldown(60);
    } catch {
      setError('Unable to request another code. Try again in a moment.');
    }
  }

  return (
    <AuthLayout>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">
        One more step
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink">
        Verify your email
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Enter the six-digit code from your email. It expires after 10 minutes.
      </p>
      <form className="mt-8 grid gap-5" onSubmit={submit} noValidate>
        {error ? (
          <StatusMessage tone="error" title="Verification failed">
            {error}
          </StatusMessage>
        ) : null}
        {message ? (
          <StatusMessage tone="success" title="Check your inbox">
            {message}
          </StatusMessage>
        ) : null}
        <FormField id="verification-email" label="Email address">
          <Input
            id="verification-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        <FormField id="verification-code" label="Verification code">
          <Input
            id="verification-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
            }
            className="font-mono text-lg tracking-[0.35em]"
          />
        </FormField>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : null}
          {submitting ? 'Verifying' : 'Verify email'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!email || cooldown > 0}
          onClick={resend}
        >
          {cooldown > 0 ? `Send again in ${cooldown}s` : 'Send another code'}
        </Button>
      </form>
      <p className="mt-8 text-sm text-muted">
        Already verified?{' '}
        <Link className="font-semibold text-violet hover:underline" to="/login">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
