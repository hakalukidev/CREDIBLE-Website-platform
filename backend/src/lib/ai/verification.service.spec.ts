import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config/env', () => ({
  env: {
    get OPENAI_API_KEY() {
      return process.env.__OPENAI_API_KEY_FOR_TEST__;
    },
    set OPENAI_API_KEY(_: string | undefined) {},
    OPENAI_MODEL: 'gpt-4o',
    LOG_LEVEL: 'silent',
    NODE_ENV: 'test',
  },
  isDev: false,
  isProd: false,
  isTest: true,
}));
vi.mock('../logger/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { analyzeApplication, heuristicAnalysis, type AiDocumentInput } from './verification.service';

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

const sampleAiPayload = {
  extractedFields: [
    { field: 'businessName', value: 'Acme Trading LLC', confidence: 92 },
    { field: 'registrationNumber', value: 'TR-2024-9988', confidence: 88 },
    { field: 'ownerName', value: 'Jane Doe', confidence: 95 },
  ],
  flags: [
    { severity: 'MEDIUM', message: 'Tax certificate is close to expiry (3 months).' },
  ],
  confidenceScore: 84,
  suggestedDecision: 'APPROVE',
  summary: 'Documents are consistent and current. Manual review still recommended.',
};

describe('verification.service (AI analysis) — heuristic stub', () => {
  beforeEach(() => {
    delete process.env.__OPENAI_API_KEY_FOR_TEST__;
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

describe('verification.service (AI analysis) — OpenAI integration', () => {
  const fetchMock = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.__OPENAI_API_KEY_FOR_TEST__ = 'sk-test-fake';
    vi.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.__OPENAI_API_KEY_FOR_TEST__;
  });

  it('calls OpenAI and parses a valid JSON response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'chatcmpl-1',
        model: 'gpt-4o-2024-08-06',
        choices: [
          {
            message: { role: 'assistant', content: JSON.stringify(sampleAiPayload) },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 500, completion_tokens: 200, total_tokens: 700 },
      }),
    });

    const result = await analyzeApplication(baseDocs());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect((init as RequestInit).method).toBe('POST');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk-test-fake');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe('gpt-4o');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].role).toBe('user');

    expect(result.modelUsed).toBe('gpt-4o');
    expect(result.suggestedDecision).toBe('APPROVE');
    expect(result.confidenceScore).toBe(84);
    expect(result.extractedFields.find((f) => f.field === 'businessName')?.value).toBe(
      'Acme Trading LLC',
    );
    expect(result.flags).toHaveLength(1);
    expect(result.flags[0].severity).toBe('MEDIUM');
    expect((result.rawResponse as { openai: { id: string } }).openai.id).toBe('chatcmpl-1');
  });

  it('strips markdown code fences from the model output before parsing', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'chatcmpl-2',
        model: 'gpt-4o',
        choices: [
          {
            message: {
              role: 'assistant',
              content: '```json\n' + JSON.stringify(sampleAiPayload) + '\n```',
            },
            finish_reason: 'stop',
          },
        ],
      }),
    });

    const result = await analyzeApplication(baseDocs());
    expect(result.confidenceScore).toBe(84);
    expect(result.suggestedDecision).toBe('APPROVE');
  });

  it('clamps confidence, defaults missing fields, and sanitises unknown severity', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'chatcmpl-3',
        model: 'gpt-4o',
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                extractedFields: [{ field: 'x', value: 'y', confidence: 9999 }],
                flags: [{ severity: 'CATASTROPHIC', message: 'mystery' }],
                confidenceScore: 250,
                summary: 'partial',
              }),
            },
            finish_reason: 'stop',
          },
        ],
      }),
    });

    const result = await analyzeApplication(baseDocs());
    expect(result.confidenceScore).toBe(100);
    expect(result.extractedFields[0].confidence).toBe(100);
    expect(result.flags[0].severity).toBe('LOW');
    expect(result.flags[0].message).toBe('mystery');
    expect(result.suggestedDecision).toBe('APPROVE');
    expect(result.summary).toBe('partial');
  });

  it('falls back to the heuristic when OpenAI returns a non-2xx status', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'rate limited',
    });

    const result = await analyzeApplication(baseDocs());
    expect(result.modelUsed).toBe('gpt-4o-fallback');
    expect(result.summary).toContain('OpenAI call failed');
    expect(result.summary).toContain('rate limited');
    expect(result.extractedFields.length).toBeGreaterThan(0);
  });

  it('falls back to the heuristic when fetch throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const result = await analyzeApplication(baseDocs());
    expect(result.modelUsed).toBe('gpt-4o-fallback');
    expect(result.summary).toContain('network down');
    expect(result.flags.length).toBe(0);
  });

  it('falls back to the heuristic when the response JSON is malformed', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'chatcmpl-4',
        model: 'gpt-4o',
        choices: [
          {
            message: { role: 'assistant', content: 'this is not JSON at all' },
            finish_reason: 'stop',
          },
        ],
      }),
    });

    const result = await analyzeApplication(baseDocs());
    expect(result.modelUsed).toBe('gpt-4o-fallback');
    expect(result.flags.length).toBe(0);
  });

  it('attaches image_url parts for vision-capable documents', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'chatcmpl-5',
        model: 'gpt-4o',
        choices: [
          { message: { role: 'assistant', content: JSON.stringify(sampleAiPayload) }, finish_reason: 'stop' },
        ],
      }),
    });

    const docs = baseDocs({ fileUrl: 'https://cdn.example.com/doc.jpg' });
    await analyzeApplication(docs);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const userContent = body.messages[1].content as Array<{ type: string; image_url?: { url: string } }>;
    const imagePart = userContent.find((p) => p.type === 'image_url');
    expect(imagePart?.image_url?.url).toBe('https://cdn.example.com/doc.jpg');
  });
});

describe('heuristicAnalysis (direct)', () => {
  it('returns the same shape regardless of call site', () => {
    const result = heuristicAnalysis(baseDocs());
    expect(result.suggestedDecision).toMatch(/APPROVE|REJECT/);
    expect(result.confidenceScore).toBeGreaterThanOrEqual(20);
    expect(result.confidenceScore).toBeLessThanOrEqual(98);
  });
});
