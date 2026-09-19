'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface AdminDocument {
  id: string;
  applicationId: string;
  businessId: string | null;
  professionalId: string | null;
  type: string;
  status: string;
  fileUrl: string | null;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  originalName: string;
  encrypted: boolean;
  aiExtraction: unknown;
  createdAt: string;
  downloadUrl: string | null;
}

export default function AdminVerificationDocumentPage() {
  const params = useParams();
  const documentId = String(params.documentId);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'verification', 'document', documentId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: AdminDocument }>(
        `/admin/verification/documents/${documentId}`,
      );
      return res.data.data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading document…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Document {documentId.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            For full context, open this document from the parent verification application.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/verification">
              <ArrowLeft className="h-4 w-4" /> Back to queue
            </Link>
          </Button>
          {data?.applicationId && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/admin/verification/${data.applicationId}`}>
                Back to application
              </Link>
            </Button>
          )}
        </div>
      </div>

      {data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Field label="Type" value={data.type} />
              <Field label="Status" value={data.status} />
              <Field label="MIME" value={data.mimeType} />
              <Field label="Size" value={`${(data.fileSize / 1024).toFixed(1)} KB`} />
              <Field label="Uploaded" value={formatDate(data.createdAt)} />
              <Field label="Original filename" value={data.originalName} />
              <Field label="Encrypted" value={data.encrypted ? 'Yes' : 'No'} />
              {data.downloadUrl ? (
                <Button asChild>
                  <a href={data.downloadUrl} target="_blank" rel="noreferrer">
                    Open file (presigned)
                  </a>
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">No presigned URL available.</p>
              )}
            </CardContent>
          </Card>

          {data.aiExtraction ? (
            <Card>
              <CardHeader>
                <CardTitle>AI extraction</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 text-xs">
                  {JSON.stringify(data.aiExtraction, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            We couldn&apos;t load this document. Use the verification queue to open documents
            through their parent application — the context is required for review.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}