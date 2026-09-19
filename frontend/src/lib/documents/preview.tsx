'use client';

import { useState } from 'react';
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  fileUrl: string;
  fileName?: string | null;
  mimeType?: string | null;
  className?: string;
  /** Maximum rendered height in pixels. */
  maxHeight?: number;
}

/**
 * Lightweight inline document preview. Renders an `<Image>` for image types,
 * an `<iframe>` for PDFs, and a "Open in new tab" link for everything else.
 *
 * Intentionally side-steps Next/Image (which doesn't support arbitrary external
 * URLs without remote-pattern config) and renders raw `<img>` tags for
 * portability.
 */
export function DocumentPreview({
  fileUrl,
  fileName,
  mimeType,
  className = '',
  maxHeight = 480,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!fileUrl) {
    return (
      <Fallback
        icon={<FileText className="h-6 w-6" />}
        title="Document unavailable"
        description="No file URL was provided for this document."
        fileUrl={fileUrl}
      />
    );
  }

  const type = (mimeType ?? '').toLowerCase();

  if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif)$/i.test(fileUrl)) {
    if (error) {
      return (
        <Fallback
          icon={<ImageIcon className="h-6 w-6" />}
          title="Image could not be loaded"
          fileUrl={fileUrl}
        />
      );
    }
    return (
      <div
        className={`relative overflow-hidden rounded-md border border-border bg-muted/20 ${className}`}
        style={{ maxHeight }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl}
          alt={fileName ?? 'document'}
          className="block h-auto w-full object-contain"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      </div>
    );
  }

  if (type === 'application/pdf' || /\.pdf$/i.test(fileUrl)) {
    return (
      <div
        className={`overflow-hidden rounded-md border border-border bg-muted/20 ${className}`}
        style={{ height: maxHeight }}
      >
        <iframe
          src={fileUrl}
          title={fileName ?? 'document'}
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <Fallback
      icon={<FileText className="h-6 w-6" />}
      title="No inline preview available"
      description="Open the document in a new tab to view it."
      fileUrl={fileUrl}
    />
  );
}

function Fallback({
  icon,
  title,
  description,
  fileUrl,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  fileUrl: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-foreground">{title}</span>
      </div>
      {description && <p>{description}</p>}
      {fileUrl && (
        <Button asChild variant="outline" size="sm">
          <a href={fileUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Open document
          </a>
        </Button>
      )}
    </div>
  );
}
