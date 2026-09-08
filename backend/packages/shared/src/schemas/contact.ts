import { z } from 'zod';

/**
 * Contact-form payload shared by the public `/contact/submissions`
 * endpoint and the React Hook Form on `/contact`.
 *
 * The honeypot `website` field must be empty — bots auto-fill every
 * input they see, so any non-empty value gets a silent 400 (no signal
 * to the bot that the form detected them).
 */
export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email address'),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be 2000 characters or fewer'),
  // Honeypot — must be empty. Never shown to real users.
  website: z.string().max(0).optional().default(''),
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
