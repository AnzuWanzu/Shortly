import { z } from 'zod';

export const createLinkSchema = z.strictObject({
  originalUrl: z.url({ protocol: /^https?$/ }),
});

export const linkIdSchema = z.uuid();

export type CreateLinkRequest = z.infer<typeof createLinkSchema>;
