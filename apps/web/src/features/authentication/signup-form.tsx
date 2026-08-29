import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { StatusMessage } from '../../components/ui/status-message';
import { ApiError } from '../../lib/api-error';
import { register } from './authentication-api';
import { signupFormSchema } from './authentication-schema';

type FieldName = 'displayName' | 'email' | 'password';
type FieldErrors = Partial<Record<FieldName, string>>;

export function SignupForm({ onRegistered }: { onRegistered: () => void }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const parsed = signupFormSchema.safeParse({ displayName, email, password });

    if (!parsed.success) {
      setFieldErrors(readFieldErrors(parsed.error.issues));
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(parsed.data);
      onRegistered();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Unable to create your account. Try again in a moment.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-8 grid gap-5" onSubmit={submit} noValidate>
      {formError ? (
        <StatusMessage tone="error" title="Signup failed">
          {formError}
        </StatusMessage>
      ) : null}
      <FormField
        id="signup-display-name"
        label="Full name"
        error={fieldErrors.displayName}
      >
        <Input
          id="signup-display-name"
          name="displayName"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          aria-invalid={Boolean(fieldErrors.displayName)}
          aria-describedby={
            fieldErrors.displayName ? 'signup-display-name-error' : undefined
          }
        />
      </FormField>
      <FormField
        id="signup-email"
        label="Email address"
        error={fieldErrors.email}
      >
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={
            fieldErrors.email ? 'signup-email-error' : undefined
          }
          placeholder="you@example.com"
        />
      </FormField>
      <FormField
        id="signup-password"
        label="Password"
        hint="Use at least 8 characters. Spaces are allowed."
        error={fieldErrors.password}
      >
        <div className="relative">
          <Input
            id="signup-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? 'signup-password-error' : undefined
            }
            className="pr-12"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-violet"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </FormField>
      <Button className="mt-1 w-full" type="submit" disabled={submitting}>
        {submitting ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : null}
        {submitting ? 'Creating account' : 'Create account'}
      </Button>
    </form>
  );
}

function readFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (
      (field === 'displayName' || field === 'email' || field === 'password') &&
      !errors[field]
    ) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
