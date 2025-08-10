import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken } from '@/lib/auth/jwt';
import crypto from 'crypto';

export default async function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  // Ensure csrf cookie exists (dev fallback)
  if (!cookieStore.get('csrf')) {
    const csrf = crypto.randomBytes(16).toString('hex');
    // Cannot set cookie directly in layout; rely on middleware in prod.
    // As a workaround for dev, render a script to set document.cookie once on client.
    // Consumers will pick it up before form submit.
    return (
      <>
        <script dangerouslySetInnerHTML={{ __html: `document.cookie = 'csrf=${csrf}; Path=/; SameSite=Lax'` }} />
        {token ? (await verifyAuth(token)) : null}
        {children}
      </>
    );
  }
  if (token) {
    try {
      await verifyAuthToken(token);
      // If token is valid, keep users away from auth pages
      redirect('/');
    } catch {}
  }
  return <>{children}</>;
}

async function verifyAuth(token: string) {
  try { await verifyAuthToken(token); redirect('/'); } catch {}
  return null;
}
