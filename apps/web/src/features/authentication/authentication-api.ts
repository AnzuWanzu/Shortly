import { apiRequest } from '../../lib/api-client';
import type { AuthenticatedUser } from '../../types/authentication';

type UserEnvelope = { user: AuthenticatedUser };
type RegistrationEnvelope = UserEnvelope & {
  verificationRequired: true;
  emailSent: boolean;
};

export type LoginInput = { email: string; password: string };
export type RegistrationInput = LoginInput & { displayName: string };
export type VerificationInput = { email: string; code: string };

export async function verifyEmail(input: VerificationInput): Promise<void> {
  await apiRequest<{ verified: true }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function resendVerification(email: string): Promise<void> {
  await apiRequest<{ accepted: true }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function getCurrentUser() {
  const response = await apiRequest<UserEnvelope>('/auth/me');
  return response.user;
}

export async function login(input: LoginInput) {
  const response = await apiRequest<UserEnvelope>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.user;
}

export async function register(input: RegistrationInput) {
  return apiRequest<RegistrationEnvelope>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function logout() {
  return apiRequest<void>('/auth/logout', { method: 'POST' });
}

export async function updateProfile(input: { displayName: string }) {
  const response = await apiRequest<UserEnvelope>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return response.user;
}
