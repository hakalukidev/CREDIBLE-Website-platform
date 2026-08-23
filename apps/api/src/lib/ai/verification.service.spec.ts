import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config/env', () => ({
  env: { OPENAI_API_KEY: undefined, LOG_LEVEL: 'silent', NODE_ENV: 'test' },
  isDev: false,
  isProd: false,
  isTest: true,
}));
vi.mock('../logger/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { analyzeApplication, type AiDocumentInput } from './verification.service';

const baseDocs = (
  overrides: Partial<AiDocumentInput> = {},
): AiDocumentInput[] => [
  {
    id: 'd1',
    type: 'TRADE_LICENSE',
    fileName: 'trade-license-2024.pdf',
    mimeType: 'application/pdf',
    fileSize: 250_000,
    ...overrides,
  },
  {
    id: 'd2',
    type: 'NATIONAL_ID',
    fileName: 'national-id.jpg',
    mimeType: 'image/jpeg',
    fileSize: 180_000,
    ...overrides,
  },
  {
    id: 'd3',
    type: 'TAX_CERTIFICATE',
    fileName: 'tin-2024.pdf',
    mimeType: 'application/pdf',
    fileSize: 220_000,
    ...overrides,
  },
];

describe('verification.service (AI analysis)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a deterministic analysis for a healthy document set', async () => {
    const result = await analyzeApplication(baseDocs());

    expect(result.modelUsed).toBe('deterministic-stub');
    expect(result.suggestedDecision).toBe('APPROVE');
    expect(result.flags).toHaveLength(0);
    expect(result.confidenceScore).toBeGreaterThanOrEqual(70);
    expect(result.extractedFields.some((f) => f.field === 'businessName')).toBe(true);
    expect(result.extractedFields.some((f) => f.field === 'ownerName')).toBe(true);
    expect(result.extractedFields.some((f) => f.field === 'tinNumber')).toBe(true);
  });

  it('flags suspiciously small files', async () => {
    const result = await analyzeApplication(
      baseDocs({ id: 'd1', fileName: 'tiny.pdf', fileSize: 1024 }),
    );
    const mediumFlags = result.flags.filter((f) => f.severity === 'MEDIUM');
    expect(mediumFlags.length).toBeGreaterThanOrEqual(1);
    expect(mediumFlags[0].message).toContain('suspiciously small');
  });

  it('flags draft/expired filenames with HIGH severity', async () => {
    const result = await analyzeApplication(
      baseDocs({ id: 'd1', fileName: 'license-expired.pdf', fileSize: 250_000 }),
    );
    const highFlags = result.flags.filter((f) => f.severity === 'HIGH');
    expect(highFlags.length).toBeGreaterThanOrEqual(1);
    expect(result.suggestedDecision).toBe('REJECT');
  });

  it('warns when fewer than 3 documents are submitted', async () => {
    const result = await analyzeApplication(baseDocs().slice(0, 2));
    expect(result.flags.some((f) => f.message.includes('at least 3'))).toBe(true);
  });

  it('always returns a confidence score between 20 and 98', async () => {
    const extreme = await analyzeApplication([
      { id: 'd1', type: 'TRADE_LICENSE', fileName: 'expired-draft-sample.pdf', mimeType: 'application/pdf', fileSize: 100 },
    ]);
    expect(extreme.confidenceScore).toBeGreaterThanOrEqual(20);
    expect(extreme.confidenceScore).toBeLessThanOrEqual(98);
  });

  it('includes rawResponse referencing the document set', async () => {
    const docs = baseDocs();
    const result = await analyzeApplication(docs);
    expect(result.rawResponse).toBeDefined();
    const sources = (result.rawResponse as { sources: { id: string }[] }).sources;
    expect(sources).toHaveLength(docs.length);
  });
});