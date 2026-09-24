'use client';

/**
 * VerificationDocumentList — controlled list of verification document
 * upload slots used during page creation (business/professional).
 *
 * Replaces the near-identical DocumentsStep/DocFilePicker blocks that
 * used to live inside the two create-* dialogs. The parent owns the
 * `docs` array; this component owns the upload button + remove button
 * + state transitions.
 */

import { useRef } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { uploadToStorage } from '@/lib/upload';
import {
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
  type VerificationTarget,
} from '@/features/verification/verification-hooks';
import {
  REQUIRED_DOCUMENTS_BY_TARGET,
} from '@/features/verification/document-requirements';

export interface DocUpload {
  type: DocumentType;
  url: string;
  filename: string;
}

export interface VerificationDocumentListProps {
  target: VerificationTarget;
  docs: DocUpload[];
  onChange: (next: DocUpload[]) => void;
  /** Override the docs that are surfaced. Defaults to the required set
   *  for the target. */
  docTypes?: readonly DocumentType[];
}

export function VerificationDocumentList({
  target,
  docs,
  onChange,
  docTypes,
}: VerificationDocumentListProps) {
  const required = docTypes ?? REQUIRED_DOCUMENTS_BY_TARGET[target];

  async function handleUpload(type: DocumentType, file: File) {
    try {
      const { publicUrl } = await uploadToStorage(file, 'public');
      onChange([
        ...docs.filter((d) => d.type !== type),
        { type, url: publicUrl, filename: file.name },
      ]);
      toast.success(`${DOCUMENT_TYPE_LABELS[type]} uploaded`);
    } catch (e) {
      toast.error(friendlyMessage(e, 'upload'));
    }
  }

  function removeDoc(type: DocumentType) {
    onChange(docs.filter((d) => d.type !== type));
  }

  return (
    <div className="space-y-3">
      {required.map((docType) => {
        const uploaded = docs.find((d) => d.type === docType);
        return (
          <Card key={docType}>
            <CardContent className="flex items-center gap-3 py-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{DOCUMENT_TYPE_LABELS[docType]}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {uploaded ? uploaded.filename : 'PDF, JPG or PNG · up to 10MB'}
                </p>
              </div>
              {uploaded ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDoc(docType)}
                  className="gap-1.5 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              ) : (
                <DocFilePicker onPick={(file) => void handleUpload(docType, file)} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DocFilePicker({ onPick }: { onPick: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => inputRef.current?.click()}
        className="gap-1.5"
      >
        <Upload className="h-3.5 w-3.5" />
        Upload
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = '';
        }}
      />
    </>
  );
}
