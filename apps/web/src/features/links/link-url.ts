import { z } from 'zod';

export const longUrlSchema = z.url({
  protocol: /^https?$/,
  error: 'Enter a complete http:// or https:// URL',
});

export function getShortUrl(slug: string) {
  return new URL(`/r/${slug}`, window.location.origin).toString();
}

export function getShortUrlLabel(slug: string) {
  const url = new URL(getShortUrl(slug));
  return `${url.host}/r/${slug}`;
}
