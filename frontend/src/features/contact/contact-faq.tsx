import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { JsonLd } from '@/components/static/json-ld';
import { faqSchema } from '@/lib/seo/structured-data';

const FAQ_ITEMS = [
  {
    question: 'How do I get my business verified on Credible?',
    answer:
      "Visit the For Business page, sign up, and submit the verification application. Our team reviews every document personally and typically responds within two business days. There's a fee to cover the cost of human review.",
  },
  {
    question: 'How long does it take to get a response?',
    answer:
      'Most enquiries are answered within 24 hours during business days. Press and partnership enquiries may take a little longer as we route them to the right team.',
  },
  {
    question: 'Can I report a fake or abusive review?',
    answer:
      "Yes. On any review, click the three-dot menu and choose 'Report'. Our moderation team reviews every report. Repeated false reports can affect your account.",
  },
  {
    question: 'Do you have an API for businesses?',
    answer:
      'A read-only public API is on the roadmap. In the meantime, verified businesses can use the embeddable badge widget to display their trust score on their own website.',
  },
  {
    question: 'How do I delete my account or my data?',
    answer:
      'Visit the Privacy page and submit a data-request form. Account deletion is processed within 30 days; export requests are usually fulfilled within 7 days.',
  },
  {
    question: 'I am a journalist — who do I contact for a quote?',
    answer:
      'Email press@credible.com with your deadline and outlet. We try to respond to media enquiries within four hours during business days.',
  },
] as const;

export function ContactFaq() {
  return (
    <section className="container-wide py-12 border-t">
      <JsonLd data={faqSchema([...FAQ_ITEMS])} />
      <h2 className="text-2xl font-bold tracking-tight">Frequently asked</h2>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Quick answers to the questions we get most often. Don&apos;t see yours? Use the form above.
      </p>
      <Accordion type="single" collapsible className="mt-6 max-w-3xl">
        {FAQ_ITEMS.map((item, idx) => (
          <AccordionItem key={item.question} value={`faq-${idx}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
