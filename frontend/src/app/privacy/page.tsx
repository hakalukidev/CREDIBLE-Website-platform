import { PageShell } from '@/components/layout/page-shell';
import { JsonLd } from '@/components/static/json-ld';
import { PrintButton } from '@/components/static/print-button';
import { TableOfContents } from '@/components/static/table-of-contents';
import { DataRequestForm } from '@/features/privacy/data-request-form';
import { pageMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description:
    'How Credible collects, uses, and protects your personal information.',
  path: '/privacy',
});

const LAST_UPDATED = '2026-09-01';

interface Section {
  id: string;
  heading: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    id: 'controller',
    heading: '1. Data controller',
    body: 'Credible is the data controller for personal information collected through this platform. Our registered office is in Dhaka, Bangladesh, and our Data Protection Officer can be reached at dpo@credible.com.',
  },
  {
    id: 'collect',
    heading: '2. Information we collect',
    body: 'We collect information you provide directly: account details (name, email, phone), business profile data, verification documents, reviews, and payment information. We also collect usage data automatically: IP address, browser type, device information, and pages visited.',
  },
  {
    id: 'use',
    heading: '3. How we use your information',
    body: 'We use your information to: provide and improve the Service; process verification applications; send transactional emails (OTP codes, verification status, payment confirmations); compute trust scores and analytics; detect and prevent fraud; and comply with legal obligations.',
  },
  {
    id: 'documents',
    heading: '4. Document handling',
    body: 'Verification documents are encrypted at rest using AES-256 encryption. Documents are stored in secure cloud storage with access restricted to the business owner and authorised administrators. Documents from rejected applications are automatically deleted after 90 days.',
  },
  {
    id: 'sharing',
    heading: '5. Information sharing',
    body: 'We do not sell your personal information. We share information only with the processors listed below, all of which are bound by data-processing agreements:',
  },
  {
    id: 'processors',
    heading: '6. Third-party processors',
    body: 'Payment gateways (SSLCommerz, aamarPay) for transactions; email delivery (SendGrid); cloud hosting (AWS, Cloudflare); error monitoring (Sentry); and analytics (privacy-respecting, no third-party advertising trackers).',
  },
  {
    id: 'transfers',
    heading: '7. International transfers',
    body: 'Some processors store data outside Bangladesh. Where that occurs we rely on standard contractual clauses or the processor\'s published compliance with applicable data-protection law. You can request a copy of the relevant safeguards by emailing dpo@credible.com.',
  },
  {
    id: 'public',
    heading: '8. Public information',
    body: 'Business profiles, reviews, ratings, and verification badge status are publicly visible. Your display name may appear alongside your reviews. You can control certain profile visibility settings from your dashboard.',
  },
  {
    id: 'cookies',
    heading: '9. Cookies and tracking',
    body: 'Credible uses essential cookies for authentication and session management. We do not use third-party advertising cookies. The cookie banner lets you accept or decline non-essential cookies; declining does not affect your ability to use the core platform.',
  },
  {
    id: 'security',
    heading: '10. Data security',
    body: 'We implement industry-standard security measures including TLS encryption, rate limiting, input sanitisation, and regular security audits. However, no method of transmission over the Internet is 100% secure.',
  },
  {
    id: 'retention',
    heading: '11. Data retention',
    body: 'Account data is retained while your account is active. Payment records are retained for 7 years for legal compliance. Verification documents from approved applications are retained for the lifetime of the verification. Other retention periods are listed in our internal records-of-processing register, available on request.',
  },
  {
    id: 'rights',
    heading: '12. Your rights',
    body: 'You have the right to: access your personal data; correct inaccurate data; request deletion of your data; export your data in a portable format; and opt out of non-essential communications. Use the data-request form below to exercise any of these.',
  },
  {
    id: 'children',
    heading: '13. Children\'s privacy',
    body: 'Credible is not intended for users under the age of 18. We do not knowingly collect information from children.',
  },
  {
    id: 'changes',
    heading: '14. Changes to this policy',
    body: 'We may update this privacy policy from time to time. Material changes will be communicated via email or a prominent notice on the platform. The latest version is always available at this URL.',
  },
  {
    id: 'contact',
    heading: '15. Contact us',
    body: 'For privacy-related enquiries, contact our Data Protection Officer at dpo@credible.com.',
  },
];

export default function PrivacyPage() {
  const toc = SECTIONS.map((s) => ({ id: s.id, label: s.heading }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Privacy Policy', url: '/privacy' }]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Credible Privacy Policy',
            url: `${SITE_URL}/privacy`,
            dateModified: LAST_UPDATED,
          },
        ]}
      />

      <PageShell
        className="py-12"
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="How Credible collects, uses, and protects your personal information."
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
            <div className="space-y-8">
              <div className="max-w-3xl space-y-8">
                {SECTIONS.map((s) => (
                  <div key={s.id} id={s.id} className="scroll-mt-24 border-l-2 border-border pl-5 hover:border-primary/40">
                    <h2 className="font-display text-lg font-semibold">{s.heading}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                ))}
              </div>

              <div className="max-w-3xl scroll-mt-24 border-t pt-8">
                <DataRequestForm />
              </div>
            </div>
          </div>
        </PageShell>
    </>
  );
}
