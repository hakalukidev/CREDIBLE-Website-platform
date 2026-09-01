/**
 * Application-level AI orchestration:
 *   1. Load all documents for the application.
 *   2. Call the AI service.
 *   3. Persist the result to AIAnalysisResult.
 *   4. Update the application status to HUMAN_REVIEW_REQUIRED with the
 *      confidence/flags attached.
 *   5. Append a status-history row.
 *
 * Per project policy the AI never approves or rejects — admin still decides.
 */
import { prisma } from '../../lib/db/prisma';
import { Prisma } from '@prisma/client';
import { analyzeApplication, type AiAnalysis } from '../../lib/ai/verification.service';
import { logger } from '../../lib/logger/logger';
import { storage } from '../../lib/storage/s3';

const VISION_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export interface RunAnalysisResult {
  analysis: AiAnalysis;
  hasFlags: boolean;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  // Prisma's JSON columns accept JsonValue-shaped objects; we accept any
  // plain serialisable value here (the AI service returns either an object
  // or null).
  if (value === null || value === undefined) return {} as Prisma.InputJsonValue;
  return value as Prisma.InputJsonValue;
}

function toNullableJson(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}

export async function runAnalysisForApplication(applicationId: string): Promise<RunAnalysisResult> {
  const app = await prisma.verificationApplication.findUnique({
    where: { id: applicationId },
    include: { documents: true },
  });
  if (!app) throw new Error(`Application ${applicationId} not found`);

  // For vision-capable documents we generate a short-lived signed download
  // URL so the LLM can actually look at the image. PDFs and other binary
  // formats fall back to metadata-only analysis.
  const docInputs = await Promise.all(
    app.documents.map(async (d) => {
      let fileUrl: string | null = null;
      if (VISION_MIME.has(d.mimeType)) {
        try {
          fileUrl = await storage.presignedDownloadUrl(d.fileKey, undefined, 600);
        } catch (err) {
          logger.warn(
            { err: err instanceof Error ? err.message : String(err), docId: d.id },
            'Could not presign document for AI — falling back to metadata-only',
          );
        }
      }
      return {
        id: d.id,
        type: d.type,
        fileName: d.originalName,
        mimeType: d.mimeType,
        fileSize: d.fileSize,
        fileUrl,
      };
    }),
  );

  const analysis = await analyzeApplication(docInputs);

  await prisma.aIAnalysisResult.upsert({
    where: { applicationId },
    create: {
      applicationId,
      extractedFields: toJson(analysis.extractedFields),
      flags: toJson(analysis.flags),
      confidenceScore: analysis.confidenceScore,
      suggestedDecision: analysis.suggestedDecision,
      summary: analysis.summary,
      rawResponse: toNullableJson(analysis.rawResponse ?? null),
      modelUsed: analysis.modelUsed,
    },
    update: {
      extractedFields: toJson(analysis.extractedFields),
      flags: toJson(analysis.flags),
      confidenceScore: analysis.confidenceScore,
      suggestedDecision: analysis.suggestedDecision,
      summary: analysis.summary,
      rawResponse: toNullableJson(analysis.rawResponse ?? null),
      modelUsed: analysis.modelUsed,
      processedAt: new Date(),
    },
  });

  await prisma.verificationApplication.update({
    where: { id: applicationId },
    data: {
      status: 'HUMAN_REVIEW_REQUIRED',
      aiScore: analysis.confidenceScore / 100,
      aiNotes: analysis.summary,
      aiRawJson: toNullableJson(analysis.rawResponse ?? null),
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId,
      status: 'HUMAN_REVIEW_REQUIRED',
      note: `AI analysis (${analysis.modelUsed}) produced confidence ${analysis.confidenceScore}% — ${analysis.flags.length} flag(s).`,
    },
  });

  logger.info(
    { applicationId, confidence: analysis.confidenceScore, suggested: analysis.suggestedDecision },
    'AI analysis complete',
  );

  return { analysis, hasFlags: analysis.flags.length > 0 };
}