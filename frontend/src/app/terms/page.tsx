import { PageShell } from '@/components/layout/page-shell';
import { JsonLd } from '@/components/static/json-ld';
import { PrintButton } from '@/components/static/print-button';
import { TableOfContents } from '@/components/static/table-of-contents';
import { pageMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata = pageMetadata({
  title: 'Terms of Service',
  description: 'The terms and conditions governing the use of the Credible platform.',
  path: '/terms',
});

const LAST_UPDATED = '2026-09-01';

interface Section {
  id: string;
  heading: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    id: 'acceptance',
    heading: '1. Acceptance of terms',
    body: 'By accessing or using the Credible platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree, you must not use the Service.',
  },
  {
    id: 'description',
    heading: '2. Description of service',
    body: 'Credible is a trust and verification platform that enables the public to search for, review, and verify businesses and professionals. Businesses can register, manage their profiles, apply for verification, and receive the Credible Verified or Certified badge.',
  },
  {
    id: 'accounts',
    heading: '3. User accounts',
    body: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information when creating an account. You must notify us immediately of any unauthorised use of your account.',
  },
  {
    id: 'reviews',
    heading: '4. Reviews',
    body: 'Reviews must reflect genuine personal experiences. One review per user per business is enforced. Reviews containing hate speech, spam, or fraudulent content will be removed. Businesses may publicly respond to reviews. You may edit your review within 24 hours of submission.',
  },
  {
    id: 'verification',
    heading: '5. Verification and badges',
    body: 'Verification applications are reviewed by human administrators. Credible reserves the right to approve, reject, or revoke verification badges at its sole discretion. Verification does not constitute endorsement of a business. Badge status can be verified at any time through the public verification page.',
  },
  {
    id: 'subscriptions',
    heading: '6. Subscriptions and payments',
    body: 'Paid subscriptions are processed through SSLCommerz or aamarPay. Prices are listed in Bangladeshi Taka (BDT). Subscriptions auto-renew unless cancelled. Refund requests are handled on a case-by-case basis within 14 days of payment.',
  },
  {
    id: 'acceptable-use',
    heading: '7. Acceptable use',
    body: 'You must use the Service only for lawful purposes. You must not impersonate any person or entity, attempt to gain unauthorised access to the platform, or use the Service to harass, defame, or harm others.',
  },
  {
    id: 'prohibited',
    heading: '8. Prohibited conduct',
    body: 'You must not: (a) use the Service for any unlawful purpose; (b) attempt to manipulate reviews or ratings; (c) submit false verification documents; (d) harass, threaten, or abuse other users; (e) circumvent rate limits or security measures; (f) scrape or harvest user data without consent.',
  },
  {
    id: 'ip',
    heading: '9. Intellectual property',
    body: 'All content, trademarks, and logos on the Credible platform are the property of Credible or its licensors. You may not reproduce, distribute, or create derivative works without prior written consent.',
  },
  {
    id: 'termination',
    heading: '10. Account termination',
    body: 'We may suspend or terminate your account at any time if we reasonably believe you have violated these terms. You may close your account at any time from your account settings. Provisions of these terms that by their nature should survive termination will survive.',
  },
  {
    id: 'indemnity',
    heading: '11. Indemnity',
    body: 'You agree to indemnify and hold Credible, its affiliates, and their respective officers and employees harmless from any claim or demand arising out of your breach of these terms or your use of the Service.',
  },
  {
    id: 'liability',
    heading: '12. Limitation of liability',
    body: 'Credible provides the Service on an "as is" and "as available" basis. We make no warranties regarding the accuracy, reliability, or availability of the Service. In no event shall Credible be liable for any indirect, incidental, or consequential damages arising from your use of the Service.',
  },
  {
    id: 'disputes',
    heading: '13. Dispute resolution',
    body: 'We will try to resolve disputes informally first. Contact us at support@credible.com. If a dispute is not resolved within 30 days, either party may pursue formal proceedings in the courts of Dhaka, Bangladesh.',
  },
  {
    id: 'modifications',
    heading: '14. Modifications',
    body: 'We reserve the right to modify these terms at any time. Material changes will be communicated via email or a notice on the platform. Continued use of the Service after changes constitutes acceptance of the modified terms.',
  },
  {
    id: 'misc',
    heading: '15. Miscellaneous',
    body: 'If any provision of these terms is held to be unenforceable, the remaining provisions will continue in effect. These terms, together with the Privacy Policy, constitute the entire agreement between you and Credible.',
  },
  {
    id: 'governing-law',
    heading: '16. Governing law',
    body: 'These terms are governed by the laws of Bangladesh. Any disputes shall be resolved in the courts of Dhaka, Bangladesh.',
  },
  {
    id: 'contact',
    heading: '17. Contact',
    body: 'If you have questions about these terms, please contact us at support@credible.com.',
  },
];

export default function TermsPage() {
  const toc = SECTIONS.map((s) => ({ id: s.id, label: s.heading }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Terms of Service', url: '/terms' }]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Credible Terms of Service',
            url: `${SITE_URL}/terms`,
            dateModified: LAST_UPDATED,
          },
        ]}
      />

      <PageShell
        className="py-12"
        eyebrow="Legal"
        title="Terms of Service"
        subtitle="These terms govern your use of the Credible platform. Print-friendly and accessible from any device."
        headerAction={<PrintButton />}
        maxWidth="full"
      >
        <p className="mb-6 text-xs text-muted-foreground">
          <time dateTime={LAST_UPDATED}>
            Last updated:{' '}
            {new Date(LAST_UPDATED).toLocaleDateString('en-BD', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </p>

          <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
            <TableOfContents items={toc} label="Sections" />
            <div className="max-w-3xl space-y-8">
              {SECTIONS.map((s) => (
                <div key={s.id} id={s.id} className="scroll-mt-24 border-l-2 border-border pl-5 hover:border-primary/40">
                  <h2 className="font-display text-lg font-semibold">{s.heading}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </PageShell>
    </>
  );
}
