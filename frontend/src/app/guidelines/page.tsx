import { PageShell } from '@/components/layout/page-shell';
import { Card, CardContent } from '@/components/ui/card';
import { JsonLd } from '@/components/static/json-ld';
import { PrintButton } from '@/components/static/print-button';
import { TableOfContents } from '@/components/static/table-of-contents';
import {
  ShieldCheck,
  AlertTriangle,
  ThumbsUp,
  Ban,
  AlertCircle,
  Slash,
  Check,
  X,
  Flag,
  Mail,
  Scale,
} from 'lucide-react';
import { pageMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/structured-data';
import { GuidelinesTransparencySection } from '@/features/guidelines/guidelines-transparency';

export const metadata = pageMetadata({
  title: 'Community Guidelines',
  description:
    'The standards and expectations for participating in the Credible community.',
  path: '/guidelines',
});

const PRINCIPLES = [
  {
    id: 'honest',
    icon: ThumbsUp,
    title: 'Be honest',
    body: 'Share genuine experiences. Reviews should reflect real interactions with a business. Never post fake reviews — whether positive or negative — for any business.',
  },
  {
    id: 'respectful',
    icon: ShieldCheck,
    title: 'Be respectful',
    body: 'Treat others as you would like to be treated. Criticise the service, not the person. Avoid personal attacks, hate speech, profanity, or discriminatory language.',
  },
  {
    id: 'specific',
    icon: AlertTriangle,
    title: 'Be specific',
    body: 'Helpful reviews describe what happened, when, and how the business responded. Specific details are more useful to other customers than vague statements.',
  },
  {
    id: 'lawful',
    icon: Ban,
    title: 'Be lawful',
    body: 'Do not post content that is defamatory, infringes intellectual property rights, or violates any applicable law. Do not share private or confidential information about others.',
  },
];

const DOS = [
  'Write reviews that describe what actually happened.',
  'Use respectful language even when you had a bad experience.',
  'Reach out to the business first to resolve the issue.',
  'Report content that violates these guidelines.',
  'Update your review if circumstances change.',
];

const DONTS = [
  'Post reviews for businesses you have not actually used.',
  'Buy, sell, or trade reviews with anyone.',
  'Threaten, harass, or intimidate other users.',
  'Share private information about a person or business.',
  'Use multiple accounts to manipulate ratings.',
];

const RULES = [
  {
    id: 'review-standards',
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
    id: 'business-responses',
    heading: 'Business response guidelines',
    items: [
      'Respond publicly and professionally to reviews.',
      'Do not retaliate against negative reviews with threats or harassment.',
      'Do not offer incentives in exchange for review removal or modification.',
      'Address the concern, not the person. Offer solutions where possible.',
    ],
  },
  {
    id: 'verification',
    heading: 'Verification and badges',
    items: [
      'Submit only genuine, unaltered documents for verification.',
      'Do not attempt to forge or manipulate verification documents.',
      'The Credible badge may not be used to imply endorsement beyond what it represents.',
      'Revoked badges must be removed from your website and marketing materials.',
    ],
  },
  {
    id: 'prohibited',
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

const REPORTING_STEPS = [
  {
    icon: Flag,
    title: 'Spot a violation',
    body: 'Click the three-dot menu on any review or business profile to find the report option.',
  },
  {
    icon: Mail,
    title: 'Report via form',
    body: 'Pick a category, describe what happened, and submit. We never reveal who filed the report.',
  },
  {
    icon: Scale,
    title: 'Moderation review',
    body: 'A moderator reviews the report, takes action if needed, and notifies both parties of the outcome.',
  },
];

const ENFORCEMENT_TIERS = [
  {
    icon: AlertCircle,
    title: 'Warning',
    body: 'A first-time minor violation. The user is notified and asked to correct the behaviour.',
  },
  {
    icon: AlertTriangle,
    title: 'Content removal',
    body: 'The offending content is removed. Repeated removals within 30 days escalate to suspension.',
  },
  {
    icon: Slash,
    title: 'Temporary suspension',
    body: 'The account is suspended for a defined period (typically 7 or 30 days) depending on severity.',
  },
  {
    icon: Ban,
    title: 'Permanent ban',
    body: 'For serious or repeated violations, the account is banned and cannot be reinstated. The user is informed of appeal rights.',
  },
];

export default function GuidelinesPage() {
  const toc = [
    ...PRINCIPLES.map((p) => ({ id: p.id, label: p.title })),
    { id: 'dos-donts', label: "Do's and don'ts" },
    { id: 'reporting', label: 'Reporting a violation' },
    { id: 'rules', label: 'Detailed rules' },
    { id: 'enforcement', label: 'Enforcement' },
    { id: 'transparency', label: 'Transparency' },
    { id: 'appeals', label: 'Appeals' },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Community Guidelines', url: '/guidelines' }]),
          faqSchema(PRINCIPLES.map((p) => ({ question: p.title, answer: p.body }))),
        ]}
      />

      <PageShell
        className="py-12"
        eyebrow="Community"
        title="Community Guidelines"
        subtitle="Credible is built on trust. These guidelines ensure our platform remains fair, honest, and useful for everyone."
        headerAction={<PrintButton />}
        maxWidth="full"
      >
          <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
            <TableOfContents items={toc} label="On this page" />

            <div className="space-y-12">
              <section id="principles" className="scroll-mt-24 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {PRINCIPLES.map(({ icon: Icon, title, body }) => (
                  <Card key={title} className="p-6 shadow-card">
                    <Icon className="h-7 w-7 text-primary" aria-hidden />
                    <h2 className="mt-3 font-semibold">{title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                  </Card>
                ))}
              </section>

              <section id="dos-donts" className="scroll-mt-24">
                <h2 className="text-2xl font-bold tracking-tight">Do&apos;s and don&apos;ts</h2>
                <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                  A quick reference. The detailed rules below cover the same ground with more nuance.
                </p>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <Card className="p-6">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-success" aria-hidden />
                      <h3 className="font-semibold">Do</h3>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm">
                      {DOS.map((item) => (
                        <li key={item} className="flex gap-2">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-success"
                            aria-hidden
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center gap-2">
                      <X className="h-5 w-5 text-destructive" aria-hidden />
                      <h3 className="font-semibold">Don&apos;t</h3>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm">
                      {DONTS.map((item) => (
                        <li key={item} className="flex gap-2">
                          <X
                            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                            aria-hidden
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </section>

          <section id="reporting" className="scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">Reporting a violation</h2>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Reports are how we keep the platform healthy. Here&apos;s the flow from spotting
              something wrong to resolution.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {REPORTING_STEPS.map((step, idx) => (
                <div key={step.title} className="relative">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                        >
                          {idx + 1}
                        </span>
                        <step.icon className="h-5 w-5 text-primary" aria-hidden />
                      </div>
                      <h3 className="mt-4 font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                    </CardContent>
                  </Card>
                  {idx < REPORTING_STEPS.length - 1 && (
                    <div
                      aria-hidden
                      className="absolute -right-3 top-1/2 hidden h-0.5 w-6 -translate-y-1/2 bg-primary/40 md:block"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          <section id="rules" className="scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">Detailed rules</h2>
            <div className="mt-6 space-y-8">
              {RULES.map((section) => (
                <div key={section.heading} id={section.id} className="scroll-mt-24">
                  <h3 className="text-lg font-semibold">{section.heading}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section id="enforcement" className="scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">Enforcement ladder</h2>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Most violations are minor and resolved with a warning. Serious or repeated
              violations escalate.
            </p>
            <ol className="mt-6 space-y-3">
              {ENFORCEMENT_TIERS.map((tier, idx) => (
                <li
                  key={tier.title}
                  className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-card"
                >
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                  >
                    <tier.icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Step {idx + 1}
                    </p>
                    <h3 className="font-semibold">{tier.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{tier.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="transparency" className="scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">Transparency</h2>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              We publish a regular transparency report with moderation volumes and response times.
            </p>
            <div className="mt-6">
              <GuidelinesTransparencySection />
            </div>
          </section>

          <section id="appeals" className="scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">Appeals</h2>
            <p className="mt-3 max-w-prose text-sm text-muted-foreground">
              If you believe an enforcement decision was made in error, you may appeal within 30
              days. Appeals are reviewed by a moderator who was not involved in the original
              decision. Send your appeal to{' '}
              <a className="underline" href="mailto:appeals@credible.com">
                appeals@credible.com
              </a>{' '}
              with the case ID and a brief description of why you believe the decision should be
              reconsidered.
            </p>
          </section>
        </div>
        </div>
      </PageShell>
    </>
  );
}
