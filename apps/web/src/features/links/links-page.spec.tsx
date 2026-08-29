import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, vi } from 'vitest';

import App from '../../app/app';

const firstLink = {
  id: '8ef22366-a9ce-4ebd-8c11-59779bcd66f4',
  slug: 'first123',
  originalUrl: 'https://example.com/first',
  userId: '1f9f091c-0244-47a2-9855-b624fc3a6014',
  createdAt: '2026-08-30T01:00:00.000Z',
};

const secondLink = {
  ...firstLink,
  id: '53ea8fd2-134d-40bc-8584-b03ab139eeec',
  slug: 'second45',
  originalUrl: 'https://medium.com/a-useful-article',
  createdAt: '2026-08-29T01:00:00.000Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

it('searches and deletes an owned link after confirmation', async () => {
  const user = userEvent.setup();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      jsonResponse({
        user: {
          id: firstLink.userId,
          email: 'anzu@example.com',
          displayName: 'Anzu',
          createdAt: '2026-08-30T00:00:00.000Z',
        },
      }),
    )
    .mockResolvedValueOnce(jsonResponse({ links: [firstLink, secondLink] }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);

  render(
    <MemoryRouter initialEntries={['/links']}>
      <App />
    </MemoryRouter>,
  );

  const search = await screen.findByLabelText('Search links');
  expect(screen.getByText(firstLink.originalUrl)).toBeInTheDocument();

  await user.type(search, 'medium');
  expect(screen.queryByText(firstLink.originalUrl)).not.toBeInTheDocument();
  expect(screen.getByText(secondLink.originalUrl)).toBeInTheDocument();

  await user.clear(search);
  await user.click(screen.getByRole('button', { name: 'Delete example.com/first' }));
  expect(screen.getByText('Delete this link?')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Confirm delete' }));

  expect(screen.queryByText(firstLink.originalUrl)).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenLastCalledWith(
    `/links/${firstLink.id}`,
    expect.objectContaining({ method: 'DELETE' }),
  );
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
