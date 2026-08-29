import { z } from 'zod';

export const profileFormSchema = z.strictObject({
  displayName: z.string().trim().min(1, 'Enter your name').max(100),
});
