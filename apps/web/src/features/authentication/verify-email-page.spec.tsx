import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';

import * as authenticationApi from './authentication-api';
import { VerifyEmailPage } from './verify-email-page';

vi.mock('./authentication-api');

describe('VerifyEmailPage', () => {
  it('submits a six-digit code for the signup email', async () => {
    const user = userEvent.setup();
    vi.mocked(authenticationApi.verifyEmail).mockResolvedValue(undefined);
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/verify-email', state: { email: 'anzu@example.com' } },
        ]}
      >
        <VerifyEmailPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Verification code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify email' }));

    expect(authenticationApi.verifyEmail).toHaveBeenCalledWith({
      email: 'anzu@example.com',
      code: '123456',
    });
  });

  it('requests another code without revealing account state', async () => {
    const user = userEvent.setup();
    vi.mocked(authenticationApi.resendVerification).mockResolvedValue(
      undefined,
    );
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/verify-email', state: { email: 'anzu@example.com' } },
        ]}
      >
        <VerifyEmailPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Send another code' }));

    expect(authenticationApi.resendVerification).toHaveBeenCalledWith(
      'anzu@example.com',
    );
  });
});
