import { Badge } from '@/components/ui/badge';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Terms of Service',
  description:
    'The terms and conditions governing the use of the Credible platform.',
  path: '/terms',
});

const SECTIONS = [
  {
    heading: '1. Acceptance of terms',
    body: 'By accessing or using the Credible platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree, you must not use the Service.',
  },
  {
    heading: '2. Description of service',
    body: 'Credible is a trust and verification platform that enables the public to search for, review, and verify businesses and professionals. Businesses can register, manage their profiles, apply for verification, and receive the Credible Verified or Certified badge.',
  },
  {
    heading: '3. User accounts',
    body: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information when creating an account. You must notify us immediately of any unauthorised use of your account.',
  },
  {
    heading: '4. Reviews',
    body: 'Reviews must reflect genuine personal experiences. One review per user per business is enforced. Reviews containing hate speech, spam, or fraudulent content will be removed. Businesses may publicly respond to reviews. You may edit your review within 24 hours of submission.',
  },
  {
    heading: '5. Verification and badges',
    body: 'Verification applications are reviewed by human administrators. Credible reserves the right to approve, reject, or revoke verification badges at its sole discretion. Verification does not constitute endorsement of a business. Badge status can be verified at any time through the public verification page.',
  },
  {
    heading: '6. Subscriptions and payments',
    body: 'Paid subscriptions are processed through SSLCommerz or aamarPay. Prices are listed in Bangladeshi Taka (BDT). Subscriptions auto-renew unless cancelled. Refund requests are handled on a case-by-case basis within 14 days of payment.',
  },
  {
    heading: '7. Prohibited conduct',
    body: 'You must not: (a) use the Service for any unlawful purpose; (b) attempt to manipulate reviews or ratings; (c) submit false verification documents; (d) harass, threaten, or abuse other users; (e) circumvent rate limits or security measures; (f) scrape or harvest user data without consent.',
  },
  {
    heading: '8. Intellectual property',
    body: 'All content, trademarks, and logos on the Credible platform are the property of Credible or its licensors. You may not reproduce, distribute, or create derivative works without prior written consent.',
  },
  {
    heading: '9. Limitation of liability',
    body: 'Credible provides the Service on an "as is" and "as available" basis. We make no warranties regarding the accuracy, reliability, or availability of the Service. In no event shall Credible be liable for any indirect, incidental, or consequential damages arising from your use of the Service.',
  },
  {
    heading: '10. Modifications',
    body: 'We reserve the right to modify these terms at any time. Material changes will be communicated via email or a notice on the platform. Continued use of the Service after changes constitutes acceptance of the modified terms.',
  },
  {
    heading: '11. Governing law',
    body: 'These terms are governed by the laws of Bangladesh. Any disputes shall be resolved in the courts of Dhaka, Bangladesh.',
  },
  {
    heading: '12. Contact',
    body: 'If you have questions about these terms, please contact us at support@credible.com.',
  },
];

export default function TermsPage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16">
          <Badge variant="secondary" className="mb-3">
            Legal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Last updated: August 2026. These terms govern your use of the Credible platform.
          </p>
        </div>
      </section>

      <section className="container-wide py-12 max-w-3xl">
        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.heading}>
              <h2 className="text-lg font-semibold">{s.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
