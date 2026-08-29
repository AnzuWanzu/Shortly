import { apiRequest } from '../../lib/api-client';
import type { AuthenticatedUser } from '../../types/authentication';

type UserEnvelope = { user: AuthenticatedUser };

export type LoginInput = { email: string; password: string };
export type RegistrationInput = LoginInput & { displayName: string };

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
  const response = await apiRequest<UserEnvelope>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.user;
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
