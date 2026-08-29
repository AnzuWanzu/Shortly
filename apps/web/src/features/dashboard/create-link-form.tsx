import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { StatusMessage } from '../../components/ui/status-message';
import { ApiError } from '../../lib/api-error';
import { createLink } from '../links/links-api';
import type { ShortLink } from '../links/link-types';
import { longUrlSchema } from '../links/link-url';

export function CreateLinkForm({
  onCreated,
}: {
  onCreated: (link: ShortLink) => void;
}) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const parsed = longUrlSchema.safeParse(originalUrl.trim());

    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Enter a valid URL');
      return;
    }

    setFieldError('');
    setSubmitting(true);
    try {
      const link = await createLink({ originalUrl: parsed.data });
      setOriginalUrl('');
      onCreated(link);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Could not shorten that link. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="mt-8 border border-line bg-surface p-5 shadow-panel sm:p-6"
      onSubmit={submit}
      noValidate
    >
      {formError ? (
        <div className="mb-5">
          <StatusMessage tone="error" title="Shortening failed">
            {formError}
          </StatusMessage>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <FormField id="long-url" label="Long URL" error={fieldError}>
          <Input
            id="long-url"
            name="originalUrl"
            type="url"
            inputMode="url"
            autoComplete="url"
            value={originalUrl}
            onChange={(event) => setOriginalUrl(event.target.value)}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? 'long-url-error' : undefined}
            placeholder="https://example.com/long-url"
          />
        </FormField>
        <Button type="submit" disabled={submitting} className="sm:min-w-36">
          {submitting ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="size-4" aria-hidden />
          )}
          {submitting ? 'Shortening' : 'Shorten link'}
        </Button>
      </div>
    </form>
  );
}
