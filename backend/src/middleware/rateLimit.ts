import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.',
    },
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Too many authentication attempts. Please try again in a few minutes.',
    },
  },
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'UPLOAD_RATE_LIMITED', message: 'Too many uploads. Please slow down.' },
  },
});

/**
 * Rate limiters for the guest review flow.
 * - reviewSubmissionRateLimit: 10 reviews / hour / IP. Defense-in-depth on
 *   top of the duplicate-review guard.
 */
export const reviewSubmissionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'REVIEW_RATE_LIMITED', message: 'Too many review submissions. Please slow down.' },
  },
});

export const inviteRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'INVITE_RATE_LIMITED', message: 'Too many invite emails. Please try again later.' },
  },
});

/**
 * Phase 5 — Public REST API limiter (60 req/min per IP). Authenticated API
 * keys get a higher per-key budget enforced in the requireApiKey middleware.
 */
export const publicApiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `ip:${req.ip ?? 'unknown'}`,
  message: {
    success: false,
    error: { code: 'PUBLIC_API_RATE_LIMITED', message: 'Too many requests to the public API.' },
  },
});

/**
 * Public `/contact/submissions` limiter — 5 / hour / IP. Bots are caught
 * by the honeypot, this is the safety net for actual spam.
 */
export const contactSubmissionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `ip:${req.ip ?? 'unknown'}`,
  message: {
    success: false,
    error: {
      code: 'CONTACT_RATE_LIMITED',
      message: 'You have sent too many messages. Please try again later.',
    },
  },
});

/**
 * Helpful-vote limiter — 30 / min / user. Generous because users may
 * legitimately scroll through many reviews on a profile page, but
 * tight enough that a runaway script can't rack up thousands of votes.
 */
export const helpfulVoteRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'HELPFUL_VOTE_RATE_LIMITED',
      message: 'You are voting too quickly. Please slow down.',
    },
  },
});