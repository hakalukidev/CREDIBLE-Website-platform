import { NextRequest, NextResponse } from 'next/server';
import { verifySignedPayload } from '@/lib/admin/jwt-edge';

/**
 * Hidden admin panel proxy (Next 16 renamed `middleware.ts` → `proxy.ts`).
 *
 * Enforces the `/admin/*` route group server-side. The admin never receives
 * a 401/403 here — either they have a valid admin JWT and proceed, or they
 * are bounced to the gateway. "Not admin" yields a 404 so the surface stays
 * invisible; "no session at all" is quietly redirected to `/admin/login`.
 *
 * Because client-side navigation does not carry a fresh auth header, the
 * admin token is read from the httpOnly `credible_admin` cookie that the
 * dedicated `/admin/login` API sets. Every authenticated visit is written to
 * the audit trail on the backend (fire-and-forget; never blocks navigation).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The gateway itself must always render.
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const secret = process.env.JWT_ADMIN_SECRET;
  const token = request.cookies.get('credible_admin')?.value;

  if (!secret || !token) {
    return redirectToGateway(request);
  }

  const payload = await verifySignedPayload(token, secret);
  if (!payload) {
    // Invalid / expired / foreign token.
    return redirectToGateway(request);
  }

  // A real (signed) token that simply isn't an admin token. 404 — never
  // reveal that the admin surface exists to non-admin users.
  if (payload.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Not found' } },
      { status: 404 },
    );
  }

  // Audit the page visit on the backend. Fire-and-forget so a slow API can
  // never gate the admin UI.
  void logVisit(request, pathname, token).catch(() => undefined);

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

function redirectToGateway(request: NextRequest): NextResponse {
  const url = new URL('/admin/login', request.url);
  // Preserve the intended destination so a successful login can bounce back.
  url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

async function logVisit(request: NextRequest, pathname: string, token: string): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    await fetch(`${apiUrl}/admin/audit/visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ path: pathname + request.nextUrl.search }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}