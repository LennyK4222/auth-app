import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken } from '@/lib/auth/jwt';
import type { JWTPayload } from '@/lib/auth/jwt';
import Link from 'next/link';
import CommentsSection from '@/components/CommentsSection';
import { ArrowLeft, User, Clock, MessageSquare } from 'lucide-react';
import ParticleNetwork from '@/components/ParticleNetwork';

function timeAgo(iso?: string | null) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'acum';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

async function getThread(base: string, id: string, cookieHeader: string | undefined) {
  const res = await fetch(`${base}/api/posts/${id}`, {
    cache: 'no-store',
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  if (!res.ok) return null;
  return res.json();
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');
  let user: JWTPayload;
  try { user = await verifyAuthToken(token); } catch { redirect('/login'); }

  const hdrs = await headers();
  const host = hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const base = `${proto}://${host}`;

  const { id } = await params; // Keep this line unchanged for context
  const cookieHeader = hdrs.get('cookie') || undefined;
  const data = await getThread(base, id, cookieHeader);
  if (!data) redirect('/');

  return (
    <>
      <div className="relative min-h-screen overflow-hidden">
        {/* CONSTELLATION PARTICLE NETWORK BACKGROUND */}
        <ParticleNetwork />

        <main className="relative mx-auto max-w-4xl px-4 py-8">
      {/* Navigation */}
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} />
          Înapoi la forum
        </Link>
      </div>

      {/* Thread Header - styled like Feed cards */}
      <article className="neon-card hover:scale-[1.01] transition-all duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-2xl font-bold text-cyan-200 glitch" data-text={data.title}>
              {data.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-300 shrink-0">
              <User size={16} className="text-cyan-400" />
              <span className="font-medium">{data.authorName || data.authorEmail}</span>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-[15px] text-slate-300 whitespace-pre-wrap leading-relaxed">
              {data.body}
            </p>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/60">
            <div className="flex items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-fuchsia-400" />
                <span suppressHydrationWarning>Publicat {timeAgo(data.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare size={12} className="text-cyan-400" />
                <span>{data.comments?.length || 0} comentarii</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-slate-400">Discuție activă</span>
            </div>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="mt-8">
        <CommentsSection postId={id} initialComments={data.comments || []} meSub={String(user.sub)} />
      </div>
        </main>
      </div>
    </>
  );
}
