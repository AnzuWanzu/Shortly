import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, vi } from 'vitest';

import App from '../../app/app';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('creates a short link and shows it in recent links', async () => {
  const user = userEvent.setup();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      jsonResponse({
        user: {
          id: '1f9f091c-0244-47a2-9855-b624fc3a6014',
          email: 'anzu@example.com',
          displayName: 'Anzu',
          createdAt: '2026-08-30T00:00:00.000Z',
        },
      }),
    )
    .mockResolvedValueOnce(jsonResponse({ links: [] }))
    .mockResolvedValueOnce(
      jsonResponse(
        {
          link: {
            id: '8ef22366-a9ce-4ebd-8c11-59779bcd66f4',
            slug: 'abc123XY',
            originalUrl: 'https://example.com/a/very/long/path',
            userId: '1f9f091c-0244-47a2-9855-b624fc3a6014',
            createdAt: '2026-08-30T01:00:00.000Z',
          },
        },
        201,
      ),
    );
  vi.stubGlobal('fetch', fetchMock);

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );

  const longUrl = 'https://example.com/a/very/long/path';
  await user.type(await screen.findByLabelText('Long URL'), longUrl);
  await user.click(screen.getByRole('button', { name: 'Shorten link' }));

  expect(await screen.findByText(/\/r\/abc123XY$/)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/links',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ originalUrl: longUrl }),
    }),
  );
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
