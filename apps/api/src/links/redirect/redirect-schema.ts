import { z } from 'zod';

export const redirectSlugSchema = z.string().regex(/^[A-Za-z0-9_-]{8}$/);
