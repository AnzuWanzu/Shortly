import { Router } from 'express';
import { EmailAlreadyExistsError } from './auth-errors';
import { registrationSchema } from './registration-schema';
import type { RegistrationInput } from './registration-schema';
import type { CreatedUser } from './registration-service';

export type RegisterUser = (input: RegistrationInput) => Promise<CreatedUser>;

type RegistrationRouterDependencies = {
  registerUser: RegisterUser;
};

export function createRegistrationRouter(
  dependencies: RegistrationRouterDependencies,
) {
  const router = Router();

  router.post('/register', async (request, response) => {
    const parsedInput = registrationSchema.safeParse(request.body);

    if (!parsedInput.success) {
      response.status(400).json({
        error: {
          code: 'INVALID_REGISTRATION_INPUT',
          message: 'Registration data is invalid',
          issues: parsedInput.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
      return;
    }

    try {
      const user = await dependencies.registerUser(parsedInput.data);

      response.status(201).json({ user });
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        response.status(409).json({
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: error.message,
          },
        });
        return;
      }

      response.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unable to register user',
        },
      });
    }
  });

  return router;
}
