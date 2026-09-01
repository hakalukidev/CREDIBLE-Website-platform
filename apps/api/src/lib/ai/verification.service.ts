/**
 * AI Document Analysis — Phase 3.
 *
 * When `OPENAI_API_KEY` is configured, this service calls the OpenAI
 * Chat Completions endpoint (`gpt-4o` by default) with a vision-capable
 * model and asks the LLM to summarise / flag the uploaded verification
 * documents. When the key is missing — or the call fails for any reason —
 * we fall back to a deterministic heuristic so the verification queue never
 * breaks because of an external API outage.
 *
 * Per project policy, this service is **advisory only** — it never approves
 * or rejects applications on its own. Every result still requires admin
 * review.
 */
import { logger } from '../logger/logger';
import { env } from '../../config/env';

export interface AiExtractedField {
  field: string;
  value: string;
  confidence: number; // 0..100
}

export interface AiFlag {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
}

export interface AiAnalysis {
  extractedFields: AiExtractedField[];
  flags: AiFlag[];
  confidenceScore: number; // 0..100
  suggestedDecision: 'APPROVE' | 'REJECT';
  summary: string;
  modelUsed: string;
  rawResponse?: unknown;
}

export interface AiDocumentInput {
  id: string;
  type: string;
  fileName?: string | null;
  mimeType: string;
  fileSize: number;
  /** Optional public URL or signed download URL for the file. */
  fileUrl?: string | null;
}

const SYSTEM_PROMPT = `You are an AI risk analyst for a trust & verification platform.
You will be given a set of business / professional verification documents
(IDs, trade licenses, tax certificates, proof of address, etc.).

Analyse each document and produce:
1. A list of extracted fields with confidence (0-100) — e.g. businessName,
   registrationNumber, ownerName, address, tinNumber, issueDate, expiryDate.
2. A list of risk flags (severity LOW / MEDIUM / HIGH). Flag things like:
     - mismatched names between documents,
     - expired or near-expiry dates,
     - unclear or possibly-tampered images,
     - missing required document types,
     - inconsistent country / addresses.
3. An overall confidence score (0-100) for the application.
4. A suggested decision: "APPROVE" if everything looks legitimate,
   "REJECT" only if you spot a high-severity fraud signal. Otherwise still
   "APPROVE" — humans will review.
5. A 2-4 sentence summary a human reviewer can skim.

Respond with strict JSON matching this exact shape:
{
  "extractedFields": [{ "field": string, "value": string, "confidence": number }],
  "flags": [{ "severity": "LOW" | "MEDIUM" | "HIGH", "message": string }],
  "confidenceScore": number,
  "suggestedDecision": "APPROVE" | "REJECT",
  "summary": string
}

Do not include any prose outside the JSON. Do not wrap the JSON in
markdown fences. The response must be valid JSON parseable by JSON.parse.`;

/**
 * Heuristic stub. Looks at:
 *  - the document set composition (number, types, sizes)
 *  - file name hints ("expired", "draft", etc.)
 *  - whether the upload looks suspiciously small (placeholder files)
 *
 * Returns a deterministic result for the same input.
 */
export function heuristicAnalysis(documents: AiDocumentInput[]): AiAnalysis {
  const extractedFields: AiExtractedField[] = [];
  const flags: AiFlag[] = [];

  const types = documents.map((d) => d.type);
  const hasTrade = types.includes('TRADE_LICENSE') || types.includes('BUSINESS_REGISTRATION');
  const hasId = types.includes('NATIONAL_ID');
  const hasTax = types.includes('TAX_CERTIFICATE');
  const hasAddress = types.includes('ADDRESS_PROOF');

  if (hasTrade) {
    extractedFields.push({
      field: 'businessName',
      value: 'See attached trade license',
      confidence: 88,
    });
    extractedFields.push({
      field: 'registrationNumber',
      value: 'See attached trade license',
      confidence: 76,
    });
  }

  if (hasId) {
    extractedFields.push({
      field: 'ownerName',
      value: 'See attached national ID',
      confidence: 91,
    });
  }

  if (hasTax) {
    extractedFields.push({
      field: 'tinNumber',
      value: 'See attached TIN certificate',
      confidence: 80,
    });
  }

  if (hasAddress) {
    extractedFields.push({
      field: 'address',
      value: 'See attached utility bill',
      confidence: 70,
    });
  }

  // Quality checks
  for (const doc of documents) {
    if (doc.fileSize < 5_000) {
      flags.push({
        severity: 'MEDIUM',
        message: `Document "${doc.fileName ?? doc.id}" is suspiciously small (${doc.fileSize} bytes) — possible placeholder or blank page.`,
      });
    }
    if (doc.fileName && /expired|invalid|draft|sample/i.test(doc.fileName)) {
      flags.push({
        severity: 'HIGH',
        message: `Filename "${doc.fileName}" suggests this document may be a draft or expired copy.`,
      });
    }
  }

  if (documents.length < 3) {
    flags.push({
      severity: 'MEDIUM',
      message: `Application only has ${documents.length} document${documents.length === 1 ? '' : 's'} — at least 3 are recommended.`,
    });
  }

  const baseConfidence =
    80 -
    flags.filter((f) => f.severity === 'HIGH').length * 12 -
    flags.filter((f) => f.severity === 'MEDIUM').length * 6 -
    flags.filter((f) => f.severity === 'LOW').length * 2;
  const confidenceScore = Math.max(20, Math.min(98, baseConfidence + extractedFields.length * 2));

  const hasHighFlag = flags.some((f) => f.severity === 'HIGH');
  const suggestedDecision: 'APPROVE' | 'REJECT' =
    hasHighFlag || confidenceScore < 50 ? 'REJECT' : 'APPROVE';

  const summary = hasHighFlag
    ? 'Automated analysis flagged issues that warrant manual review.'
    : 'Documents look consistent. Recommend human reviewer confirm before approval.';

  return {
    extractedFields,
    flags,
    confidenceScore,
    suggestedDecision,
    summary,
    modelUsed: 'deterministic-stub',
    rawResponse: { sources: documents.map((d) => ({ id: d.id, type: d.type })) },
  };
}

interface OpenAIMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenAIMessageContent[];
}

interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  response_format?: { type: 'json_object' };
  temperature?: number;
  max_tokens?: number;
}

interface OpenAIChatResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function buildUserMessage(documents: AiDocumentInput[]): OpenAIMessage {
  const visionCapable = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  const parts: OpenAIMessageContent[] = [];

  const intro =
    `Analyse the following ${documents.length} verification document(s).\n\n` +
    'Document metadata:\n' +
    documents
      .map(
        (d, i) =>
          `  ${i + 1}. id=${d.id} type=${d.type} fileName="${d.fileName ?? ''}" ` +
          `mimeType=${d.mimeType} size=${d.fileSize}`,
      )
      .join('\n') +
    '\n\nIf image URLs are attached, inspect them. PDFs and other binary files ' +
    'are described by their metadata only — note any concerns based on filename, ' +
    'size, and declared type.';
  parts.push({ type: 'text', text: intro });

  for (const doc of documents) {
    if (doc.fileUrl && visionCapable.has(doc.mimeType)) {
      parts.push({ type: 'image_url', image_url: { url: doc.fileUrl } });
    }
  }

  return { role: 'user', content: parts };
}

function clampConfidence(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 70;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseAiContent(raw: string): AiAnalysis {
  // Strip a defensive ```json ... ``` wrapper in case the model emits one
  // despite the system prompt.
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '');
  const parsed = JSON.parse(stripped) as Partial<AiAnalysis>;

  const extractedFields: AiExtractedField[] = Array.isArray(parsed.extractedFields)
    ? parsed.extractedFields
        .filter((f) => typeof f === 'object' && f !== null)
        .map((f) => {
          const raw = f as unknown as Record<string, unknown>;
          return {
            field: typeof raw.field === 'string' ? raw.field : 'unknown',
            value:
              typeof raw.value === 'string'
                ? raw.value
                : raw.value == null
                  ? ''
                  : String(raw.value),
            confidence: clampConfidence(raw.confidence),
          };
        })
    : [];

  const flags: AiFlag[] = Array.isArray(parsed.flags)
    ? parsed.flags
        .filter((f) => typeof f === 'object' && f !== null)
        .map((f) => {
          const raw = f as unknown as Record<string, unknown>;
          const severity: AiFlag['severity'] =
            raw.severity === 'HIGH' || raw.severity === 'MEDIUM' || raw.severity === 'LOW'
              ? raw.severity
              : 'LOW';
          return {
            severity,
            message: typeof raw.message === 'string' ? raw.message : 'Flag (no message)',
          };
        })
    : [];

  const suggestedDecision: 'APPROVE' | 'REJECT' =
    parsed.suggestedDecision === 'REJECT' ? 'REJECT' : 'APPROVE';

  return {
    extractedFields,
    flags,
    confidenceScore: clampConfidence(parsed.confidenceScore),
    suggestedDecision,
    summary:
      typeof parsed.summary === 'string'
        ? parsed.summary
        : 'AI analysis completed without a textual summary.',
    modelUsed: env.OPENAI_MODEL ?? 'gpt-4o',
    rawResponse: parsed,
  };
}

async function callOpenAI(documents: AiDocumentInput[]): Promise<AiAnalysis> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const body: OpenAIChatRequest = {
    model: env.OPENAI_MODEL ?? 'gpt-4o',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, buildUserMessage(documents)],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 1500,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `OpenAI request failed with status ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as OpenAIChatResponse;
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response contained no content');
  }

  const parsed = parseAiContent(content);
  return {
    ...parsed,
    rawResponse: {
      ...(typeof parsed.rawResponse === 'object' && parsed.rawResponse !== null
        ? (parsed.rawResponse as Record<string, unknown>)
        : {}),
      openai: {
        id: json.id,
        model: json.model,
        usage: json.usage,
        finishReason: json.choices?.[0]?.finish_reason,
      },
    },
  };
}

/**
 * Public entry point. Calls OpenAI when `OPENAI_API_KEY` is set, falling back
 * to the deterministic heuristic if the key is missing or the API call fails.
 * The shape of the returned object is identical regardless of branch.
 */
export async function analyzeApplication(
  documents: AiDocumentInput[],
): Promise<AiAnalysis> {
  if (!env.OPENAI_API_KEY) {
    logger.info(
      { count: documents.length },
      'OPENAI_API_KEY not set — using deterministic stub for AI analysis',
    );
    return heuristicAnalysis(documents);
  }

  try {
    const result = await callOpenAI(documents);
    logger.info(
      {
        count: documents.length,
        model: result.modelUsed,
        confidence: result.confidenceScore,
        flags: result.flags.length,
        suggested: result.suggestedDecision,
      },
      'OpenAI analysis complete',
    );
    return result;
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      'OpenAI analysis failed — falling back to deterministic stub',
    );
    // Stamp the fallback so admins can see in the AIAnalysisResult row that
    // the live path was attempted but failed.
    const fallback = heuristicAnalysis(documents);
    return {
      ...fallback,
      modelUsed: `${env.OPENAI_MODEL ?? 'gpt-4o'}-fallback`,
      summary: `${fallback.summary} (OpenAI call failed: ${err instanceof Error ? err.message : 'unknown error'})`,
    };
  }
}
