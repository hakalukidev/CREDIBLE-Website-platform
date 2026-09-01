import { Badge } from '@/components/ui/badge';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description:
    'How Credible collects, uses, and protects your personal information.',
  path: '/privacy',
});

const SECTIONS = [
  {
    heading: '1. Information we collect',
    body: 'We collect information you provide directly: account details (name, email, phone), business profile data, verification documents, reviews, and payment information. We also collect usage data automatically: IP address, browser type, device information, and pages visited.',
  },
  {
    heading: '2. How we use your information',
    body: 'We use your information to: provide and improve the Service; process verification applications; send transactional emails (OTP codes, verification status, payment confirmations); compute trust scores and analytics; detect and prevent fraud; and comply with legal obligations.',
  },
  {
    heading: '3. Document handling',
    body: 'Verification documents are encrypted at rest using AES-256 encryption. Documents are stored in secure cloud storage with access restricted to the business owner and authorised administrators. Documents from rejected applications are automatically deleted after 90 days.',
  },
  {
    heading: '4. Information sharing',
    body: 'We do not sell your personal information. We may share information with: payment gateways (SSLCommerz, aamarPay) to process transactions; email services (SendGrid) to deliver transactional emails; cloud providers (AWS, Cloudflare) to host the platform; and law enforcement when required by law.',
  },
  {
    heading: '5. Public information',
    body: 'Business profiles, reviews, ratings, and verification badge status are publicly visible. Your name may appear alongside your reviews. You can control certain profile visibility settings from your dashboard.',
  },
  {
    heading: '6. Cookies and tracking',
    body: 'Credible uses essential cookies for authentication and session management. We do not use third-party advertising cookies. Analytics data is collected in aggregate to improve the Service.',
  },
  {
    heading: '7. Data security',
    body: 'We implement industry-standard security measures including SSL/TLS encryption, rate limiting, input sanitisation, and regular security audits. However, no method of transmission over the Internet is 100% secure.',
  },
  {
    heading: '8. Data retention',
    body: 'Account data is retained while your account is active. Payment records are retained for 7 years for legal compliance. You may request data deletion by contacting support@credible.com, subject to legal retention requirements.',
  },
  {
    heading: '9. Your rights',
    body: 'You have the right to: access your personal data; correct inaccurate data; request deletion of your data; export your data in a portable format; and opt out of non-essential communications.',
  },
  {
    heading: '10. Children\'s privacy',
    body: 'Credible is not intended for users under the age of 18. We do not knowingly collect information from children.',
  },
  {
    heading: '11. Changes to this policy',
    body: 'We may update this privacy policy from time to time. Material changes will be communicated via email or a prominent notice on the platform.',
  },
  {
    heading: '12. Contact us',
    body: 'For privacy-related enquiries, please contact us at support@credible.com.',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16">
          <Badge variant="secondary" className="mb-3">
            Legal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Last updated: August 2026. This policy describes how Credible handles your data.
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
