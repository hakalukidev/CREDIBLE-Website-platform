import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, Comfortaa } from 'next/font/google';
import { Providers } from './providers';
import { ChromeFrame } from '@/components/layout/chrome-frame';
import { siteMetadata } from '@/lib/seo/metadata';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const display = Comfortaa({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = siteMetadata;
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F8FC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0F19' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${display.variable}`}>
      <head>
        {/*
          Pre-paint theme boot. Rendered as a real HTML <script> from a
          server component (not JSX inside a React client tree), so it does
          not trip the React 19 / Next 16 "script tag inside React
          component" diagnostic that next-themes' inline script did.

          The site is currently locked to the theme stored in localStorage
          (defaulting to light at the OS level). This script reads the
          stored preference (light | dark | system) and applies the
          matching class before first paint.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='theme';var s=localStorage.getItem(k);var mode=s==='dark'?'dark':s==='light'?'light':(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(mode==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}document.documentElement.style.colorScheme=mode;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Providers>
          <TooltipProvider delayDuration={150}>
            <ChromeFrame>{children}</ChromeFrame>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}