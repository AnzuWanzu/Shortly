import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, vi } from 'vitest';

import App from '../../app/app';

const currentUser = {
  id: '1f9f091c-0244-47a2-9855-b624fc3a6014',
  email: 'anzu@example.com',
  displayName: 'Anzu',
  createdAt: '2026-08-30T00:00:00.000Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

it('updates the profile and logs out', async () => {
  const user = userEvent.setup();
  const updatedUser = { ...currentUser, displayName: 'Anzu Updated' };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(jsonResponse({ user: currentUser }))
    .mockResolvedValueOnce(jsonResponse({ user: updatedUser }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);

  render(
    <MemoryRouter initialEntries={['/settings']}>
      <App />
    </MemoryRouter>,
  );

  const nameInput = await screen.findByLabelText('Full name');
  expect(screen.getByLabelText('Email address')).toHaveValue(currentUser.email);

  await user.clear(nameInput);
  await user.type(nameInput, '  Anzu Updated  ');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));

  expect(await screen.findByText('Changes saved')).toBeInTheDocument();
  expect(screen.getByText('Anzu Updated')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Log out' }));
  expect(
    await screen.findByRole('heading', { name: 'Welcome back' }),
  ).toBeInTheDocument();
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/auth/logout',
    expect.objectContaining({ method: 'POST' }),
  );
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
