import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, vi } from 'vitest';

import App from './app';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('shows the login screen at the public login route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
        }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Welcome back' }),
    ).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  });

  it('shows the shortening workspace for an authenticated user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            user: {
              id: '1f9f091c-0244-47a2-9855-b624fc3a6014',
              email: 'anzu@example.com',
              displayName: 'Anzu',
              createdAt: '2026-08-30T00:00:00.000Z',
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Shorten a link' }),
    ).toBeTruthy();
  });
});
