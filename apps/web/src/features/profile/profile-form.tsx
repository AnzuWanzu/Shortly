import { LoaderCircle, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { StatusMessage } from '../../components/ui/status-message';
import { ApiError } from '../../lib/api-error';
import type { AuthenticatedUser } from '../../types/authentication';
import { updateProfile } from '../authentication/authentication-api';
import { profileFormSchema } from './profile-schema';

export function ProfileForm({
  user,
  onUpdated,
}: {
  user: AuthenticatedUser;
  onUpdated: (user: AuthenticatedUser) => void;
}) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setSaved(false);
    const parsed = profileFormSchema.safeParse({ displayName });

    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Enter a valid name');
      return;
    }

    setFieldError('');
    setSubmitting(true);
    try {
      const updatedUser = await updateProfile(parsed.data);
      setDisplayName(updatedUser.displayName);
      onUpdated(updatedUser);
      setSaved(true);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Could not save your profile. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="border border-line bg-surface p-5 shadow-panel sm:p-6"
      onSubmit={submit}
      noValidate
    >
      <h2 className="text-lg font-semibold text-ink">Profile information</h2>
      <div className="mt-6 grid max-w-xl gap-5">
        {saved ? <StatusMessage tone="success" title="Changes saved" /> : null}
        {formError ? (
          <StatusMessage tone="error" title="Save failed">
            {formError}
          </StatusMessage>
        ) : null}
        <FormField
          id="profile-display-name"
          label="Full name"
          error={fieldError}
        >
          <Input
            id="profile-display-name"
            name="displayName"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={
              fieldError ? 'profile-display-name-error' : undefined
            }
          />
        </FormField>
        <FormField
          id="profile-email"
          label="Email address"
          hint="Email changes are not available in this version."
        >
          <Input id="profile-email" type="email" value={user.email} readOnly />
        </FormField>
        <div>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <Save className="size-4" aria-hidden />
            )}
            {submitting ? 'Saving' : 'Save changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
