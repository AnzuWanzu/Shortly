import { apiRequest } from '../../lib/api-client';
import type { CreateLinkInput, ShortLink } from './link-types';

type LinkEnvelope = { link: ShortLink };
type LinksEnvelope = { links: ShortLink[] };

export async function listLinks() {
  const response = await apiRequest<LinksEnvelope>('/links');
  return response.links;
}

export async function createLink(input: CreateLinkInput) {
  const response = await apiRequest<LinkEnvelope>('/links', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.link;
}

export async function deleteLink(id: string) {
  return apiRequest<void>(`/links/${id}`, { method: 'DELETE' });
}
