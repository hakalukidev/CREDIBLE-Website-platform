'use client';

import * as React from 'react';
import { Twitter, Linkedin, Link as LinkIcon, Check, Facebook } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

/**
 * Share row used at the bottom of a blog post. Three outbound targets
 * (Twitter/X, Facebook, LinkedIn) plus a copy-to-clipboard action with a
 * momentary "Copied" affordance.
 */
export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // No-op in environments where clipboard isn't available.
    }
  };

  const targets = [
    {
      label: 'Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <div className="mt-10 rounded-2xl border border-border/60 bg-gradient-to-br from-card to-primary/[0.04] p-5 shadow-card sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Share this post
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {targets.map(({ label, icon: Icon, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${label}`}
            className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3.5 text-xs font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </a>
        ))}
        <button
          type="button"
          onClick={copy}
          aria-label="Copy link to clipboard"
          className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3.5 text-xs font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <LinkIcon className="h-3.5 w-3.5" aria-hidden />
              Copy link
            </>
          )}
        </button>
      </div>
    </div>
  );
}
