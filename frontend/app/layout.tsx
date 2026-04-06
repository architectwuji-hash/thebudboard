import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title:       'TheBudBoard — Ocala Medical Flower Deals',
  description: 'Real-time medical cannabis flower deals from Ocala FL dispensaries. Trulieve, Curaleaf, Surterra, Fluent.',
  keywords:    ['medical cannabis', 'ocala florida', 'dispensary deals', 'flower', 'trulieve', 'curaleaf', 'surterra', 'fluent'],
  openGraph: {
    title:       'TheBudBoard — Ocala Medical Flower Deals',
    description: 'Real-time flower deals from every Ocala dispensary, updated every 3 hours.',
    url:         'https://thebudboard.com',
    siteName:    'TheBudBoard',
    locale:      'en_US',
    type:        'website',
  },
};

export const viewport: Viewport = {
  width:          'device-width',
  initialScale:   1,
  maximumScale:   1,
  themeColor:     '#080e08',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
