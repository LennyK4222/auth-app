import type { Metadata, Viewport } from 'next';

// Base metadata configuration
const baseMetadata: Partial<Metadata> = {
  applicationName: 'Auth App',
  authors: [{ name: 'Auth App Team' }],
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Auth App',
  },
  formatDetection: {
    telephone: false,
  },
};

// Base viewport configuration
export const baseViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  colorScheme: 'dark light',
};

// Helper function to create page metadata
export function createMetadata(
  title: string,
  description: string,
  additionalMetadata?: Partial<Metadata>
): Metadata {
  const pageTitle = title === 'Auth App' ? title : `${title} | Auth App`;
  
  return {
    ...baseMetadata,
    title: pageTitle,
    description,
    keywords: additionalMetadata?.keywords || ['social', 'platform', 'community', 'sharing', 'networking'],
    openGraph: {
      type: 'website',
      locale: 'ro_RO',
      alternateLocale: 'en_US',
      url: '/',
      siteName: 'Auth App',
      title: pageTitle,
      description,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Auth App - Social Platform',
        },
      ],
      ...additionalMetadata?.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@authapp',
      creator: '@authapp',
      title: pageTitle,
      description,
      images: ['/og-image.png'],
      ...additionalMetadata?.twitter,
    },
    ...additionalMetadata,
  };
}

// Export base viewport for pages to use
export const viewport = baseViewport;
