import { describe, expect, it } from 'vitest';
import {
  addVerificationDocumentSchema,
  appealVerificationSchema,
  cancelApplicationSchema,
  reviewVerificationDecisionSchema,
  revokeBadgeSchema,
  startVerificationSchema,
  submitVerificationSchema,
} from './verification';

describe('startVerificationSchema', () => {
  it('accepts an empty body and defaults to BASIC', () => {
    const parsed = startVerificationSchema.parse({});
    expect(parsed.level).toBe('BASIC');
    expect(parsed.type).toBe('BASIC');
  });

  it('rejects an invalid level', () => {
    expect(() => startVerificationSchema.parse({ level: 'GOLD' })).toThrow();
  });
});

describe('submitVerificationSchema', () => {
  it('defaults to {}', () => {
    expect(submitVerificationSchema.parse(undefined)).toEqual({});
  });

  it('trims and accepts notes', () => {
    expect(
      submitVerificationSchema.parse({ additionalNotes: '  hello world  ' }),
    ).toEqual({ additionalNotes: 'hello world' });
  });
});

describe('reviewVerificationDecisionSchema', () => {
  it('requires a reason on rejection', () => {
    expect(() =>
      reviewVerificationDecisionSchema.parse({ decision: 'REJECT' }),
    ).toThrow(/Rejection reason/);
  });

  it('accepts an APPROVE with optional notes', () => {
    expect(
      reviewVerificationDecisionSchema.parse({
        decision: 'APPROVE',
        notes: 'all good',
      }),
    ).toMatchObject({ decision: 'APPROVE' });
  });

  it('accepts an APPROVE with badgeType', () => {
    const parsed = reviewVerificationDecisionSchema.parse({
      decision: 'APPROVE',
      badgeType: 'CERTIFIED',
    });
    expect(parsed.badgeType).toBe('CERTIFIED');
  });
});

describe('appealVerificationSchema', () => {
  it('requires at least 10 chars', () => {
    expect(() => appealVerificationSchema.parse({ reason: 'too short' })).toThrow();
  });

  it('accepts a long reason', () => {
    expect(
      appealVerificationSchema.parse({
        reason: 'We have additional documentation that resolves the issues raised.',
      }).reason.length,
    ).toBeGreaterThan(10);
  });
});

describe('revokeBadgeSchema', () => {
  it('requires a reason', () => {
    expect(() => revokeBadgeSchema.parse({ reason: 'x' })).toThrow();
  });

  it('accepts a 5+ char reason', () => {
    expect(revokeBadgeSchema.parse({ reason: 'spam' }).reason).toBe('spam');
  });
});

describe('cancelApplicationSchema', () => {
  it('accepts undefined', () => {
    expect(cancelApplicationSchema.parse(undefined)).toBeUndefined();
  });
});

describe('addVerificationDocumentSchema', () => {
  it('rejects unsupported MIME types', () => {
    expect(() =>
      addVerificationDocumentSchema.parse({
        type: 'OTHER',
        fileKey: 'docs/abc.pdf',
        fileUrl: 'https://cdn.example/docs/abc.pdf',
        mimeType: 'application/zip',
        fileSize: 100,
        originalName: 'a.zip',
      }),
    ).toThrow();
  });

  it('rejects files larger than 20MB', () => {
    expect(() =>
      addVerificationDocumentSchema.parse({
        type: 'OTHER',
        fileKey: 'docs/big.pdf',
        fileUrl: 'https://cdn.example/docs/big.pdf',
        mimeType: 'application/pdf',
        fileSize: 30 * 1024 * 1024,
        originalName: 'big.pdf',
      }),
    ).toThrow();
  });

  it('accepts a valid PDF upload', () => {
    const parsed = addVerificationDocumentSchema.parse({
      type: 'TRADE_LICENSE',
      fileKey: 'docs/2024/abc.pdf',
      fileUrl: 'https://cdn.example/docs/2024/abc.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024 * 50,
      originalName: 'trade-license.pdf',
    });
    expect(parsed.encrypt).toBe(true);
    expect(parsed.type).toBe('TRADE_LICENSE');
  });
});