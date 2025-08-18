import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppProvider } from "@/hooks/useApp";
import { AuthProvider } from "@/hooks/useAuth";
import { CsrfProvider } from "@/contexts/CsrfContext";
import "./globals.css";
import { cookies, headers } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import Navbar from "@/components/Navbar";
import Heartbeat from "@/components/Heartbeat";
import ToasterClient from "@/components/ToasterClient";
import ClientOnlyEffects from "@/components/ClientOnlyEffects";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Auth App - Social Platform",
  description: "Connect, share, and grow with our vibrant community",
  applicationName: "Auth App",
  authors: [{ name: "Auth App Team" }],
  generator: "Next.js",
  keywords: ["social", "platform", "community", "sharing", "networking"],
  referrer: "origin-when-cross-origin",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    alternateLocale: "en_US",
    url: "https://auth-app.com",
    siteName: "Auth App",
    title: "Auth App - Social Platform",
    description: "Connect, share, and grow with our vibrant community",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Auth App - Social Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@authapp",
    creator: "@authapp",
    title: "Auth App - Social Platform",
    description: "Connect, share, and grow with our vibrant community",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Auth App",
  },
  formatDetection: {
    telephone: false,
  },
  category: "social",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0ea5e9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  colorScheme: 'dark light',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hdrs = await headers();
  const cspNonce = hdrs.get('x-nonce') || undefined;
  const token = cookieStore.get("token")?.value;
  let isAuthed = false;
  
  if (token) {
    try {
      await verifyAuthToken(token);
      isAuthed = true;
    } catch {}
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 text-foreground ${geistSans.variable}`}>
        {/* Theme script to avoid flash */}
        <script
          nonce={cspNonce}
          dangerouslySetInnerHTML={{
            __html: `
            try {
        const stored = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = stored || (prefersDark ? 'dark' : 'light');
        if (theme === 'dark') document.documentElement.classList.add('dark');
            } catch {}
          `,
          }}
        />
        <CsrfProvider>
          <AuthProvider>
            <Navbar ssrIsAuthed={isAuthed} />
            <AppProvider>
              {isAuthed && <Heartbeat />}
              {/* Global client-only visuals (particles + AdminAura controlled via settings) */}
              <ClientOnlyEffects />
              {children}
            </AppProvider>
          </AuthProvider>
        </CsrfProvider>
        <ToasterClient />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
