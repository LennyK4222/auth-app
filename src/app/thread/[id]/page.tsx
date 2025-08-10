import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken } from '@/lib/auth/jwt';
import Link from 'next/link';
import CommentsSection from '@/components/CommentsSection';
import { ArrowLeft, User, Clock, MessageSquare } from 'lucide-react';

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

async function getThread(base: string, id: string) {
  const res = await fetch(`${base}/api/posts/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');
  let user: any;
  try { user = await verifyAuthToken(token); } catch { redirect('/login'); }

  const hdrs = await headers();
  const host = hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const base = `${proto}://${host}`;

  const { id } = await params; // Keep this line unchanged for context
  const data = await getThread(base, id);
  if (!data) redirect('/');
  const csrf = cookieStore.get('csrf')?.value || '';

  return (
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

      {/* Thread Header */}
      <article className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-xl shadow-xl dark:from-slate-900/80 dark:to-slate-800/80 dark:border-slate-700/60">
        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              {data.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 shrink-0">
              <User size={16} />
              <span className="font-medium">{data.authorName || data.authorEmail}</span>
            </div>
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {data.body}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Publicat {timeAgo(data.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare size={12} />
                <span>{data.comments?.length || 0} comentarii</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Discuție activă</span>
            </div>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="mt-8">
        <CommentsSection postId={id} initialComments={data.comments || []} meSub={String(user.sub)} />
      </div>
    </main>
  );
}
