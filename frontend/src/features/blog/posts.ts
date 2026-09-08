// Static blog corpus. Posts are TypeScript-defined (no MDX) so the body
// is an array of discriminated blocks (`heading | paragraph | list |
// quote | code`) — keeps rendering code-based, type-safe, and search-
// friendly without a markdown plugin.

export type BlogPostBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'code'; language?: string; text: string };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO date
  readTime: string;
  /** Single emoji used as a decorative cover — keeps the page self-contained without fabricated stock photos. */
  coverEmoji: string;
  author: {
    name: string;
    role: string;
    initials: string;
  };
  body: BlogPostBlock[];
  relatedSlugs?: string[];
}

export const CATEGORIES = ['Trust', 'Product', 'Guide', 'Updates'] as const;
export type BlogCategory = (typeof CATEGORIES)[number];

export const POSTS: BlogPost[] = [
  {
    slug: 'why-trust-matters',
    title: 'Why trust matters more than ever in Bangladesh',
    excerpt:
      "In a digital-first economy, consumers rely on online reviews before making purchasing decisions. Here's why building public trust is critical for every business.",
    category: 'Trust',
    date: '2026-08-15',
    readTime: '5 min',
    coverEmoji: '🤝',
    author: {
      name: 'Credible Editorial',
      role: 'Trust & Insights',
      initials: 'CE',
    },
    body: [
      {
        type: 'paragraph',
        text: "Bangladesh's digital economy is growing faster than the frameworks meant to protect it. Every day, millions of consumers make decisions about which restaurant to try, which doctor to visit, or which mobile repair shop to trust — all based on signals that are easier to fake than ever.",
      },
      { type: 'heading', level: 2, text: 'Trust is the new currency' },
      {
        type: 'paragraph',
        text: 'Word of mouth has moved online. The cousin who used to recommend a mechanic now leaves a Google review. The colleague who once told you about a great tailor now posts on Facebook. Trust still travels the same way — person to person — but it lives somewhere new.',
      },
      { type: 'heading', level: 2, text: 'What real trust requires' },
      {
        type: 'paragraph',
        text: 'A genuine trust signal has three properties: it is verifiable, it is transparent, and it is earned through time. Credible was built to combine all three.',
      },
      {
        type: 'list',
        items: [
          'Verification — businesses that want a badge have to prove who they are.',
          'Transparency — reviews, responses, and verification criteria are all public.',
          'Time — the trust score reflects sustained behaviour, not a single good month.',
        ],
      },
    ],
    relatedSlugs: ['how-verification-works', 'trust-score-explained'],
  },
  {
    slug: 'how-verification-works',
    title: 'How the Credible verification process works',
    excerpt:
      "A step-by-step look at how our human-reviewed verification process works — from document submission to badge issuance.",
    category: 'Product',
    date: '2026-08-10',
    readTime: '4 min',
    coverEmoji: '✅',
    author: {
      name: 'Verification Team',
      role: 'Human Reviewers',
      initials: 'VT',
    },
    body: [
      {
        type: 'paragraph',
        text: 'A Credible Verified badge is not a sticker you can buy. Every application is reviewed by a real human at our verification desk. Here is what that looks like, end to end.',
      },
      { type: 'heading', level: 2, text: 'Step 1 — Submit your documents' },
      {
        type: 'paragraph',
        text: "You tell us who you are. We ask for the legal name on your trade licence, the registration number, the address on file, and a few photos of the business premises. The exact list depends on your category — a restaurant needs a food licence, a clinic needs a BMDC registration.",
      },
      { type: 'heading', level: 2, text: 'Step 2 — Human review' },
      {
        type: 'paragraph',
        text: 'A reviewer checks every document. If something is missing, they tell you — politely and clearly. The median turnaround is two business days.',
      },
      { type: 'heading', level: 2, text: 'Step 3 — Badge issued' },
      {
        type: 'paragraph',
        text: 'Once approved, the badge appears on your profile forever. If anything changes (a new owner, a new address), we ask you to tell us, and we re-verify. The badge always reflects current reality.',
      },
    ],
    relatedSlugs: ['why-trust-matters', 'trust-score-explained'],
  },
  {
    slug: 'collecting-better-reviews',
    title: '7 tips for collecting more authentic reviews',
    excerpt:
      'Authentic reviews are the foundation of trust. Learn practical strategies to encourage genuine feedback from your customers.',
    category: 'Guide',
    date: '2026-08-05',
    readTime: '6 min',
    coverEmoji: '⭐',
    author: {
      name: 'Community & Support',
      role: 'Moderation & Care',
      initials: 'CS',
    },
    body: [
      {
        type: 'paragraph',
        text: 'The best businesses earn their reviews. They do not buy them, do not coerce them, and do not chase them. They simply make it easy for happy customers to be heard.',
      },
      { type: 'heading', level: 2, text: 'The seven tips' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Ask at the moment of delight — right after a successful transaction.',
          'Use the QR code on your receipt or table tent.',
          'Make the link short — long URLs kill conversion.',
          'Say thank you, even for tough reviews.',
          'Respond to every review within 48 hours.',
          'Never offer a discount in exchange for a review.',
          'Share your profile link in your email signature.',
        ],
      },
      {
        type: 'quote',
        text: 'A business that is afraid of honest feedback has bigger problems than its rating.',
      },
    ],
    relatedSlugs: ['responding-to-negative-reviews', 'trust-score-explained'],
  },
  {
    slug: 'trust-score-explained',
    title: 'Understanding your business trust score',
    excerpt:
      'Your trust score is computed from multiple signals — reviews, verification status, response rate, and more. Here\'s how each factor contributes.',
    category: 'Product',
    date: '2026-07-28',
    readTime: '5 min',
    coverEmoji: '📊',
    author: {
      name: 'Product & Design',
      role: 'UX & Research',
      initials: 'PD',
    },
    body: [
      {
        type: 'paragraph',
        text: 'Your Credible trust score is a number from 0 to 100. It is meant to summarise, at a glance, how much a stranger should trust your business based on what is publicly verifiable.',
      },
      { type: 'heading', level: 2, text: 'What goes into the score' },
      {
        type: 'list',
        items: [
          'Average review rating (30%)',
          'Volume of verified reviews (25%)',
          'Verification status — Verified or Certified (20%)',
          'Response rate and average response time (15%)',
          'Recency — how fresh the activity is (10%)',
        ],
      },
      { type: 'heading', level: 2, text: 'What does not go into the score' },
      {
        type: 'paragraph',
        text: 'Paid placements, advertising spend, and any direct way to buy a higher score. We surface those rules publicly so a business cannot game the system simply by spending more.',
      },
    ],
    relatedSlugs: ['why-trust-matters', 'how-verification-works'],
  },
  {
    slug: 'responding-to-negative-reviews',
    title: "How to respond to negative reviews professionally",
    excerpt:
      "A negative review isn't the end — it's an opportunity. Learn the do's and don'ts of responding to critical feedback.",
    category: 'Guide',
    date: '2026-07-20',
    readTime: '4 min',
    coverEmoji: '🛡️',
    author: {
      name: 'Community & Support',
      role: 'Moderation & Care',
      initials: 'CS',
    },
    body: [
      {
        type: 'paragraph',
        text: 'A one-star review feels like a punch in the gut. The trick is to remember that future customers reading it will be paying more attention to your response than to the review itself.',
      },
      { type: 'heading', level: 2, text: 'The rules' },
      {
        type: 'list',
        items: [
          "Don't argue the facts in public — take it offline.",
          "Don't apologise for the sake of it — be specific.",
          "Don't copy and paste — every reply should acknowledge the person.",
          "Don't ignore it — silence reads as indifference.",
        ],
      },
      {
        type: 'quote',
        text: 'The goal is not to win the review. The goal is to win the next customer who reads it.',
      },
    ],
    relatedSlugs: ['collecting-better-reviews', 'trust-score-explained'],
  },
  {
    slug: 'platform-updates-august-2026',
    title: 'Platform updates: August 2026',
    excerpt:
      'New features, improvements, and fixes shipped this month — including widget analytics, improved search, and mobile optimisations.',
    category: 'Updates',
    date: '2026-07-15',
    readTime: '3 min',
    coverEmoji: '🚀',
    author: {
      name: 'Product & Design',
      role: 'UX & Research',
      initials: 'PD',
    },
    body: [
      { type: 'heading', level: 2, text: 'Widget analytics' },
      {
        type: 'paragraph',
        text: 'Verified businesses can now see how many people view their embedded badge each week, where they came from, and how many clicked through to the full profile.',
      },
      { type: 'heading', level: 2, text: 'Improved search' },
      {
        type: 'paragraph',
        text: 'Search now respects diacritics, supports Bangla transliteration, and learns from the category a user picks on the Browse page. The first result is now correct about 30% more often.',
      },
      { type: 'heading', level: 2, text: 'Mobile optimisations' },
      {
        type: 'paragraph',
        text: 'Profile pages load roughly 40% faster on mid-range Android devices. The image gallery now uses lazy-loading by default.',
      },
    ],
    relatedSlugs: ['how-verification-works', 'collecting-better-reviews'],
  },
  {
    slug: 'embeddable-badges-launch',
    title: 'Embed the Credible badge on your own website',
    excerpt:
      'Verified businesses can now drop the Credible badge on their own site with a single snippet, linking back to the public profile.',
    category: 'Updates',
    date: '2026-09-01',
    readTime: '2 min',
    coverEmoji: '🔗',
    author: {
      name: 'Product & Design',
      role: 'UX & Research',
      initials: 'PD',
    },
    body: [
      {
        type: 'paragraph',
        text: 'Starting today, every Verified business can embed a Credible badge on its own website. The badge links back to the public profile, so visitors can read reviews without leaving the original site.',
      },
      { type: 'heading', level: 2, text: 'How to embed' },
      {
        type: 'paragraph',
        text: 'Visit your dashboard, open the Verification tab, and copy the snippet. It works on any HTML page; no JavaScript framework required.',
      },
      {
        type: 'code',
        language: 'html',
        text: '<a href="https://credible.bd/business/your-slug">\n  <img src="https://credible.bd/badge/your-slug.svg" alt="Credible Verified" />\n</a>',
      },
    ],
    relatedSlugs: ['platform-updates-august-2026', 'how-verification-works'],
  },
  {
    slug: 'building-trust-in-bangladesh',
    title: 'Building trust in Bangladesh: a long-form view',
    excerpt:
      'A field report from the verification desk — what we learned visiting 200+ businesses across Dhaka, Chattogram, and Sylhet.',
    category: 'Trust',
    date: '2026-06-30',
    readTime: '8 min',
    coverEmoji: '🇧🇩',
    author: {
      name: 'Credible Editorial',
      role: 'Trust & Insights',
      initials: 'CE',
    },
    body: [
      {
        type: 'paragraph',
        text: 'For six months our verification team travelled the country. We sat in 200+ businesses — from Gulshan offices to Old Dhaka shops — and asked the same question: what would make your customers trust you more?',
      },
      { type: 'heading', level: 2, text: 'What we heard' },
      {
        type: 'list',
        items: [
          'Almost universally, businesses wanted a way to be recognised beyond word of mouth.',
          'Most had tried some form of online marketing — and felt the results were noisy.',
          'Few had a system for collecting feedback at the moment of delight.',
        ],
      },
      { type: 'heading', level: 2, text: 'What we built' },
      {
        type: 'paragraph',
        text: 'The verification program was the direct answer to what we heard. It is not glamorous — it is paperwork, photos, and patience. But it is the foundation everything else rests on.',
      },
    ],
    relatedSlugs: ['why-trust-matters', 'how-verification-works'],
  },
];

const POST_BY_SLUG = new Map(POSTS.map((post) => [post.slug, post]));

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POST_BY_SLUG.get(slug);
}

export function getRelatedPosts(post: BlogPost, limit = 2): BlogPost[] {
  const related = new Set<string>(post.relatedSlugs ?? []);
  // Same-category posts are a sensible fallback if explicit relateds are missing.
  for (const candidate of POSTS) {
    if (related.size >= limit) break;
    if (candidate.slug === post.slug) continue;
    if (related.has(candidate.slug)) continue;
    if (candidate.category === post.category) related.add(candidate.slug);
  }
  return [...related]
    .map((slug) => POST_BY_SLUG.get(slug))
    .filter((p): p is BlogPost => Boolean(p))
    .slice(0, limit);
}

/** Slug → id friendly anchor used by the table-of-contents on detail pages. */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
