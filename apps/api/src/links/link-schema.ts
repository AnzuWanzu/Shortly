import { z } from 'zod';

export const createLinkSchema = z.strictObject({
  originalUrl: z.string(),
});

export const linkIdSchema = z.string();

export type CreateLinkRequest = z.infer<typeof createLinkSchema>;
