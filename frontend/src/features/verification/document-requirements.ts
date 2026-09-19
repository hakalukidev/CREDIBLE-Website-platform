import type {
  DocumentType,
  VerificationTarget,
  VerificationDocument,
} from './verification-hooks';
import { DOCUMENT_TYPE_LABELS } from './verification-hooks';

/**
 * Per-target minimum documents required for an application to be submittable.
 *
 * - business    → trade license, tax certificate, proof of address.
 * - professional → professional license, national id, proof of address.
 *
 * These are intentionally a small, fixed set so the AI extractor and admin
 * reviewer have predictable inputs and the user has a clear "what to upload"
 * checklist.
 */
export const REQUIRED_DOCUMENTS_BY_TARGET: Record<
  VerificationTarget,
  readonly DocumentType[]
> = {
  business: ['TRADE_LICENSE', 'TAX_CERTIFICATE', 'ADDRESS_PROOF'] as const,
  professional: [
    'PROFESSIONAL_LICENSE',
    'NATIONAL_ID',
    'ADDRESS_PROOF',
  ] as const,
};

/**
 * Optional documents that strengthen an application but are not required.
 * Listed in the order we want them to surface in the upload UI.
 */
export const OPTIONAL_DOCUMENTS_BY_TARGET: Record<
  VerificationTarget,
  readonly DocumentType[]
> = {
  business: ['BUSINESS_REGISTRATION', 'NATIONAL_ID', 'OTHER'] as const,
  professional: ['TAX_CERTIFICATE', 'BUSINESS_REGISTRATION', 'OTHER'] as const,
};

/**
 * The full ordered list of recommended docs (required first, then optional)
 * for a given target.
 */
export function getRecommendedDocuments(target: VerificationTarget): DocumentType[] {
  return [
    ...REQUIRED_DOCUMENTS_BY_TARGET[target],
    ...OPTIONAL_DOCUMENTS_BY_TARGET[target],
  ];
}

export function getRequiredDocuments(target: VerificationTarget): DocumentType[] {
  return [...REQUIRED_DOCUMENTS_BY_TARGET[target]];
}

/**
 * Returns the required document types that are still missing from the
 * uploaded list. Order matches `REQUIRED_DOCUMENTS_BY_TARGET`.
 */
export function getMissingRequiredDocs(
  uploaded: DocumentType[],
  target: VerificationTarget,
): DocumentType[] {
  const uploadedSet = new Set(uploaded);
  return REQUIRED_DOCUMENTS_BY_TARGET[target].filter(
    (docType) => !uploadedSet.has(docType),
  );
}

export function hasAllRequiredDocs(
  uploaded: DocumentType[],
  target: VerificationTarget,
): boolean {
  return getMissingRequiredDocs(uploaded, target).length === 0;
}

/**
 * Slim helper that accepts either a list of DocumentType values or a list of
 * VerificationDocument objects (from the API). Both are common in the upload
 * step.
 */
export function getMissingRequiredDocsFromDocs(
  docs: Pick<VerificationDocument, 'type'>[] | DocumentType[] | undefined,
  target: VerificationTarget,
): DocumentType[] {
  if (!docs || docs.length === 0) {
    return [...REQUIRED_DOCUMENTS_BY_TARGET[target]];
  }
  const uploaded = Array.isArray(docs[0])
    ? (docs as unknown as DocumentType[])
    : (docs as Pick<VerificationDocument, 'type'>[]).map((d) => d.type);
  return getMissingRequiredDocs(uploaded, target);
}

/**
 * Human-readable label for a doc type, with a fallback so we never crash on
 * an unknown enum value.
 */
export function labelFor(docType: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[docType] ?? docType;
}

/**
 * Short helper used in the wizard to decide whether the user can hit "Submit".
 * Returns true only when every required document has been uploaded at least
 * once.
 */
export function canSubmit(
  docs: Pick<VerificationDocument, 'type'>[] | undefined,
  target: VerificationTarget,
): boolean {
  return getMissingRequiredDocsFromDocs(docs, target).length === 0;
}
