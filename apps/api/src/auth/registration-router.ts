import { Router } from 'express';
import type { RegistrationInput } from './registration-schema';
import type { CreatedUser } from './registration-service';

export type RegisterUser = (
  input: RegistrationInput,
) => Promise<CreatedUser>;

type RegistrationRouterDependencies = {
  registerUser: RegisterUser;
};

export function createRegistrationRouter(
  _dependencies: RegistrationRouterDependencies,
) {
  const router = Router();

  router.post('/register', () => {
    throw new Error('Not implemented');
  });

  return router;
}
