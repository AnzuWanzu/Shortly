import { z } from 'zod';

export const loginFormSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Enter a valid email address')),
  password: z.string().min(1, 'Enter your password').max(128),
});

export const signupFormSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Enter a valid email address')),
  displayName: z.string().trim().min(1, 'Enter your name').max(100),
  password: z
    .string()
    .min(15, 'Use at least 15 characters')
    .max(128, 'Use no more than 128 characters'),
});
