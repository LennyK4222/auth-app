import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { ToasterClient } from "@/components/ToasterClient";
import { LogoutButton } from "@/components/LogoutButton";
import "./globals.css";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

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
        name: user?.name || (payload as any).name,
        email: user?.email || (payload as any).email,
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
        <nav className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/95 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/95">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                  Forum
                </span>
              </Link>
              
              {isAuthed && (
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <Link href="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                    Acasă
                  </Link>
                  <Link href="/trending" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                    Trending
                  </Link>
                  <Link href="/categories" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                    Categorii
                  </Link>
                  <Link href="/create" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                    Creează
                  </Link>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthed ? (
                <>
                  <span className="hidden sm:block text-sm text-slate-600 dark:text-slate-300">
                    Salut, {userInfo?.name || userInfo?.email?.split('@')[0]}
                  </span>
                  {userInfo?.role === 'admin' && (
                    <Link 
                      href="/admin" 
                      className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                    >
                      👑 Admin
                    </Link>
                  )}
                  <Link 
                    href="/settings" 
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    ⚙️ Setări
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
        {children}
        <ToasterClient />
      </body>
    </html>
  );
}
