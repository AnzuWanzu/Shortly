import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, vi } from 'vitest';

import App from '../../app/app';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('logs in with valid credentials and opens the workspace', async () => {
  const user = userEvent.setup();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      jsonResponse(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } },
        401,
      ),
    )
    .mockResolvedValueOnce(
      jsonResponse({
        user: {
          id: '1f9f091c-0244-47a2-9855-b624fc3a6014',
          email: 'anzu@example.com',
          displayName: 'Anzu',
          createdAt: '2026-08-30T00:00:00.000Z',
        },
      }),
    );
  vi.stubGlobal('fetch', fetchMock);

  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>,
  );

  await user.type(screen.getByLabelText('Email address'), 'anzu@example.com');
  await user.type(screen.getByLabelText('Password'), 'correct horse battery staple');
  await user.click(screen.getByRole('button', { name: 'Log in' }));

  expect(
    await screen.findByRole('heading', { name: 'Shorten a link' }),
  ).toBeInTheDocument();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
