/**
 * AI Document Analysis — Phase 3.
 *
 * In production this would call GPT-4o / Claude-3 with the prompt template
 * described in the Phase 3 spec. For the current build we ship a deterministic
 * stub that returns plausible analysis based on file metadata. The stub is
 * deliberately structured so the LLM can be swapped in without touching
 * callers — the `analyzeApplication` function is the only public surface.
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
}

/**
 * Heuristic stub. Looks at:
 *  - the document set composition (number, types, sizes)
 *  - file name hints ("expired", "draft", etc.)
 *  - whether the upload looks suspiciously small (placeholder files)
 *
 * Returns a deterministic result for the same input.
 */
function heuristicAnalysis(documents: AiDocumentInput[]): AiAnalysis {
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

  const baseConfidence = 80 - flags.filter((f) => f.severity === 'HIGH').length * 12 -
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

/**
 * Real entry point — would call the LLM provider if `OPENAI_API_KEY` were set.
 * Until then we fall back to the deterministic stub. The shape is identical.
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

  // Real LLM call would go here. We deliberately don't pull in an SDK at this
  // stage so the deployment isn't gated on it. When you wire GPT-4o / Claude,
  // replace this branch with an `openai`/`@anthropic-ai/sdk` call and return
  // the parsed response. Keep the shape identical to `AiAnalysis`.
  logger.warn('OPENAI_API_KEY is set but the live integration is not yet implemented; falling back to stub.');
  return heuristicAnalysis(documents);
}