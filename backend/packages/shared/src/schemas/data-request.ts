import { z } from 'zod';

/**
 * GDPR / data-rights request submitted from the Privacy page.
 * Authenticated users only — the controller enforces auth.
 */
export const dataRequestSchema = z.object({
  type: z.enum(['ACCESS', 'CORRECTION', 'DELETION', 'EXPORT'], {
    message: 'Pick a request type',
  }),
  notes: z.string().trim().max(2000).optional(),
});

export type DataRequestInput = z.infer<typeof dataRequestSchema>;
