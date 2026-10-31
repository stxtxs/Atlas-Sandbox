import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Providers } from './providers';
import './globals.css';

// Three font families per the ui_design system:
//  • Space Grotesk — display (headings, brand)
//  • Inter         — body
//  • JetBrains Mono — mono (KPIs, tickers, code, monospace small caps)
//
// Self-hosted (next/font/local), NOT next/font/google: the Google loader fetches
// the font files from fonts.gstatic.com AT BUILD TIME, and when that fetch flakes
// on a cold Vercel build the whole deploy fails with a font module-not-found.
// The latin woff2s live in ./fonts and ship with the repo, so builds never touch
// the network. Weights are variable ranges. Re-download: Google Fonts CSS2 API,
// latin subset (see scripts or app/fonts/README if refreshing).
const spaceGrotesk = localFont({
  src: './fonts/space-grotesk.woff2',
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: '300 700',
});

const inter = localFont({
  src: './fonts/inter.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
});

const jetbrainsMono = localFont({
  src: './fonts/jetbrains-mono.woff2',
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: '100 800',
});

const TITLE = 'Atlas Tutorial | Sports Tech Intelligence by SportsTechX';
const DESCRIPTION =
  'A guided, hands-on tour of Atlas Explore, Raise and Scout on sample data. No account needed.';

export const metadata: Metadata = {
  title: { default: TITLE, template: '%s | Atlas Tutorial' },
  description: DESCRIPTION,
  applicationName: 'Atlas Tutorial',
  authors: [{ name: 'SportsTechX', url: 'https://sportstechx.com' }],
  creator: 'SportsTechX',
  publisher: 'SportsTechX GmbH',
  openGraph: { type: 'website', siteName: 'Atlas by SportsTechX', locale: 'en_US', title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#060a17' },
  ],
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // Fixed density. The theme
      // attribute (data-theme) is now managed entirely by next-themes via
      // providers.tsx — no hardcoded default here, otherwise it sticks.
      // `compact` matches the ui_design_3 shipped default.
      data-density="compact"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
