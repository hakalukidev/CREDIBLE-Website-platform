import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'Modern Slavery Statement',
  description:
    "Credible's statement on modern slavery and human trafficking, in line with the Modern Slavery Act 2015.",
  path: '/modern-slavery',
});

const SECTIONS = [
  {
    heading: 'Our commitment',
    body: 'Credible is committed to preventing modern slavery and human trafficking in our business and our supply chains. We operate with integrity and transparency, and we expect the same from everyone we work with.',
  },
  {
    heading: 'What we do',
    body: 'We are a digital review and verification platform. Our team is small and our operations are transparent. We prohibit forced labour, child labour, and human trafficking in every part of our business and among our partners.',
  },
  {
    heading: 'Our supply chains',
    body: 'We work with a limited number of service providers. We assess them for risk and require them to uphold the same ethical standards that we hold ourselves to.',
  },
  {
    heading: 'Reporting',
    body: 'Any concerns about modern slavery or human trafficking can be reported through our contact page, and every report is treated confidentially and investigated promptly.',
  },
];

export default function ModernSlaveryPage() {
  return (
    <div className="py-12">
      <PageShell
        eyebrow="Legal"
        title="Modern Slavery Statement"
        subtitle="Prepared in line with the Modern Slavery Act 2015."
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-lg font-semibold">{s.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </PageShell>
    </div>
  );
}
