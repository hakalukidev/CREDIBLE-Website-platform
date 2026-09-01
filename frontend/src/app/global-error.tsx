'use client';

/**
 * Root-level error boundary. Catches errors that escape the route segment
 * error boundary (e.g. errors inside the root layout itself). Because this
 * replaces the root HTML, we need to ship inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          margin: 0,
          padding: 0,
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          color: '#111827',
        }}
      >
        <div style={{ maxWidth: 480, padding: 32, textAlign: 'center' }}>
          <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>Critical error</p>
          <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>The app crashed</h1>
          <p style={{ color: '#6b7280', margin: '0 0 16px' }}>
            Please reload the page. If the problem persists, contact support.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: '8px 16px',
              background: '#1a56db',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}