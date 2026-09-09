import { apiClient } from '@/lib/api/client';

export type UploadNamespace = 'documents' | 'public' | 'avatars' | 'badges';

export interface UploadResult {
  key: string;
  publicUrl: string;
}

/**
 * Upload a file to S3/R2 with automatic fallback.
 *
 * 1. Tries the presigned direct-upload path (POST /uploads/presign → PUT the
 *    bytes straight to the bucket). This is the efficient path — the browser
 *    talks to the storage endpoint directly.
 *
 * 2. Direct PUTs only work when the bucket allows cross-origin requests
 *    (CORS). If the bucket lacks CORS the browser blocks the PUT silently, so
 *    we fall back to POST /uploads/object, which proxies the bytes through
 *    our API. Either way the caller gets `{ key, publicUrl }`.
 */
export async function uploadToStorage(file: File, namespace: UploadNamespace): Promise<UploadResult> {
  try {
    const presignRes = await apiClient.post<{
      success: true;
      data: {
        url: string;
        key: string;
        publicUrl: string;
        expiresIn: number;
        maxBytes: number;
        headers: Record<string, string>;
      };
    }>('/uploads/presign', {
      namespace,
      contentType: file.type,
      originalName: file.name,
      size: file.size,
    });
    const { url, key, publicUrl, headers } = presignRes.data.data;

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: { ...headers },
      body: file,
    });
    if (putRes.ok) {
      return { key, publicUrl };
    }
    throw new Error(`Direct upload to storage failed (${putRes.status})`);
  } catch {
    // Presigned direct PUT failed (missing bucket CORS, network, or auth).
    // Upload through the API instead so uploads work regardless of the
    // bucket's CORS configuration.
    const form = new FormData();
    form.append('file', file);
    form.append('namespace', namespace);
    const proxyRes = await apiClient.post<{
      success: true;
      data: { key: string; publicUrl: string };
    }>('/uploads/object', form, { timeout: 60_000 });
    return proxyRes.data.data;
  }
}