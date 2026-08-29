import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, vi } from 'vitest';

import App from '../../app/app';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('creates an account and sends the user to login', async () => {
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
      jsonResponse(
        {
          user: {
            id: '1f9f091c-0244-47a2-9855-b624fc3a6014',
            email: 'anzu@example.com',
            displayName: 'Anzu',
            createdAt: '2026-08-30T00:00:00.000Z',
          },
        },
        201,
      ),
    );
  vi.stubGlobal('fetch', fetchMock);

  render(
    <MemoryRouter initialEntries={['/signup']}>
      <App />
    </MemoryRouter>,
  );

  await user.type(screen.getByLabelText('Full name'), '  Anzu  ');
  await user.type(screen.getByLabelText('Email address'), '  ANZU@example.com  ');
  await user.type(screen.getByLabelText('Password'), 'eight888');
  await user.click(screen.getByRole('button', { name: 'Create account' }));

  expect(
    await screen.findByRole('heading', { name: 'Welcome back' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Account created')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/auth/register',
    expect.objectContaining({
      body: JSON.stringify({
        email: 'anzu@example.com',
        displayName: 'Anzu',
        password: 'eight888',
      }),
    }),
  );
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
