import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { AppProvider } from "@/hooks/useApp";
import { AuthProvider } from "@/hooks/useAuth";
import { CsrfProvider } from "@/contexts/CsrfContext";
import "./globals.css";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Auth App",
  description: "Login & Register with Next.js and MongoDB",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let isAuthed = false;
  let userInfo: { name?: string; email: string; role?: string } | null = null;
  
  if (token) {
    try {
      const payload = await verifyAuthToken(token);
      await connectToDatabase();
      const user = await User.findById(payload.sub).select('name email role');
      
      isAuthed = true;
      userInfo = {
        name: user?.name || (payload as { name?: string }).name || '',
        email: user?.email || (payload as { email?: string }).email || '',
        role: user?.role || 'user'
      };
    } catch {}
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 text-foreground ${geistSans.variable}`}>
        {/* Theme script to avoid flash */}
        <script
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
            <Navbar ssrIsAuthed={isAuthed} ssrUser={userInfo} />
            <AppProvider>
              {/* {isAuthed && <Heartbeat />} */}
              {children}
            </AppProvider>
          </AuthProvider>
        </CsrfProvider>
        {/* <ToasterClient /> */}
      </body>
    </html>
  );
}
