import { z } from 'zod';

export const registrationSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  displayName: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(128),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
