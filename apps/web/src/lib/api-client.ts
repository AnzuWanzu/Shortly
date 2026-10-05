import { ApiError, type ApiIssue } from './api-error';

const CSRF_HEADER_NAME = 'x-shortly-csrf';
const CSRF_HEADER_VALUE = '1';
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

type ErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    issues?: ApiIssue[];
  };
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method?.toUpperCase() ?? 'GET';
  const headers = new Headers(options.headers);

  headers.set('accept', 'application/json');
  if (options.body) {
    headers.set('content-type', 'application/json');
  }
  if (MUTATING_METHODS.has(method)) {
    headers.set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE);
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await readJson(response);
  if (!response.ok) {
    const envelope = payload as ErrorEnvelope;
    throw new ApiError(
      envelope.error?.message ?? 'The request could not be completed',
      response.status,
      envelope.error?.code ?? 'UNKNOWN_ERROR',
      envelope.error?.issues ?? [],
    );
  }

  return payload as T;
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined;
  }

  return response.json();
}
