import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, AlertTriangle, ThumbsUp, Ban } from 'lucide-react';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Community Guidelines',
  description:
    'The standards and expectations for participating in the Credible community.',
  path: '/guidelines',
});

const PRINCIPLES = [
  {
    icon: ThumbsUp,
    title: 'Be honest',
    body: 'Share genuine experiences. Reviews should reflect real interactions with a business. Never post fake reviews — whether positive or negative — for any business.',
  },
  {
    icon: ShieldCheck,
    title: 'Be respectful',
    body: 'Treat others as you would like to be treated. Criticise the service, not the person. Avoid personal attacks, hate speech, profanity, or discriminatory language.',
  },
  {
    icon: AlertTriangle,
    title: 'Be specific',
    body: 'Helpful reviews describe what happened, when, and how the business responded. Specific details are more useful to other customers than vague statements.',
  },
  {
    icon: Ban,
    title: 'Be lawful',
    body: 'Do not post content that is defamatory, infringes intellectual property rights, or violates any applicable law. Do not share private or confidential information about others.',
  },
];

const RULES = [
  {
    heading: 'Review standards',
    items: [
      'One review per user per business. Duplicate reviews are removed.',
      'Reviews must be based on a genuine customer experience.',
      'Reviews should not contain spam, advertisements, or promotional links.',
      'Do not review a business you have a financial relationship with (e.g., employees reviewing their own employer).',
      'You may edit your review within 24 hours of submission.',
    ],
  },
  {
    heading: 'Business response guidelines',
    items: [
      'Respond publicly and professionally to reviews.',
      'Do not retaliate against negative reviews with threats or harassment.',
      'Do not offer incentives in exchange for review removal or modification.',
      'Address the concern, not the person. Offer solutions where possible.',
    ],
  },
  {
    heading: 'Verification and badges',
    items: [
      'Submit only genuine, unaltered documents for verification.',
      'Do not attempt to forge or manipulate verification documents.',
      'The Credible badge may not be used to imply endorsement beyond what it represents.',
      'Revoked badges must be removed from your website and marketing materials.',
    ],
  },
  {
    heading: 'Prohibited behaviour',
    items: [
      'Review manipulation (posting fake reviews, buying reviews, or soliciting reviews in exchange for incentives).',
      'Harassment, threats, or intimidation of other users.',
      'Attempting to circumvent platform security or rate limits.',
      'Scraping or harvesting user data without explicit consent.',
      'Using the platform for any activity that violates Bangladeshi law.',
    ],
  },
];

export default function GuidelinesPage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16">
          <Badge variant="secondary" className="mb-3">
            Community
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Community Guidelines
          </h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Credible is built on trust. These guidelines ensure our platform remains fair, honest,
            and useful for everyone.
          </p>
        </div>
      </section>

      <section className="container-wide py-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PRINCIPLES.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="container-wide py-12 border-t">
        <div className="max-w-3xl space-y-8">
          {RULES.map((section) => (
            <div key={section.heading}>
              <h2 className="text-lg font-semibold">{section.heading}</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="container-wide py-12 border-t">
        <div className="max-w-3xl">
          <h2 className="text-lg font-semibold">Enforcement</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Violations of these guidelines may result in content removal, account suspension, or
            permanent ban. Serious violations (e.g., document fraud, harassment) may be reported to
            law enforcement. If you believe content on Credible violates these guidelines, please
            contact us at support@credible.com.
          </p>
        </div>
      </section>
    </>
  );
}
