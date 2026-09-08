/**
 * Root admin layout — applies to both `/admin/login` (unauthenticated) and
 * the `(protected)` sub-route group. We deliberately don't guard here so the
 * login page renders without a redirect loop. Each protected admin page
 * inherits the auth check from `app/admin/(protected)/layout.tsx`.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
