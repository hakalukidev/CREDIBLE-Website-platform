/**
 * Renders a Schema.org JSON-LD `<script>` block.
 *
 * Use `data` as either a single object or an array — the array form
 * is convenient when emitting breadcrumb + WebPage nodes together.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
