import { z } from 'zod';

export const profileUpdateSchema = z.strictObject({
  displayName: z.string(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
