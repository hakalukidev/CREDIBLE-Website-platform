import { ContactForm } from '@/features/contact/contact-form';
import { ContactFaq } from '@/features/contact/contact-faq';
import { PageShell } from '@/components/layout/page-shell';
import { JsonLd } from '@/components/static/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, ORG_ID, SITE_NAME } from '@/lib/seo/structured-data';

export const metadata = pageMetadata({
  title: 'Contact Us',
  description:
    'Get in touch with the Credible team. We respond to all enquiries within 24 hours.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Contact', url: '/contact' }]),
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/contact`,
            name: 'Contact Credible',
            publisher: { '@id': ORG_ID, name: SITE_NAME },
          },
        ]}
      />
      <PageShell
        className="py-12"
        eyebrow="Get in touch"
        title="Contact Credible"
        subtitle="Reach out for press, partnerships, support, or to report an issue. We read every message and respond within 24 hours, Monday through Friday."
      >
        <ContactForm />
        <div className="mt-12">
          <ContactFaq />
        </div>
      </PageShell>
    </>
  );
}
