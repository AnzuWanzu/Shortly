import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import App from './app';

describe('App', () => {
  it('shows the login screen at the public login route', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Welcome back' }),
    ).toBeTruthy();
  });
});
