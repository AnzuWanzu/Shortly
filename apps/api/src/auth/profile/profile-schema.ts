import { z } from 'zod';

export const profileUpdateSchema = z.strictObject({
  displayName: z.string().trim().min(1).max(100),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
