// ...cod valid...
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken } from '@/lib/auth/jwt';
import Link from 'next/link';
import { MessageSquare, Calendar, Bookmark, Award } from 'lucide-react';
import { RecentUsersWidget } from '@/components/RecentUsersWidget';
import FeedClient from '../components/FeedClient';
import HolographicDisplay from '@/components/HolographicDisplay';
import TrendingCategories from '@/components/TrendingCategories';
import ParticleNetwork from '@/components/ParticleNetwork';
import AdminAura from '@/components/AdminAura';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    redirect('/login');
  }
  try {
    // Validate JWT only; do not hard-require DB session to allow first-load
    await verifyAuthToken(token);
  } catch {
    redirect('/login');
  }
  return (
    <>
      <div className="relative min-h-screen overflow-hidden">
      {/* CONSTELLATION PARTICLE NETWORK BACKGROUND */}
      <ParticleNetwork />
      {/* Admin-only aura overlay */}
      <AdminAura />
      
      <main className="relative container mx-auto px-4 py-8">
        <section className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Feed */}
          <div className="lg:col-span-2">
            <HolographicDisplay>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">Feed recent</h2>
              </div>
            </HolographicDisplay>
            <FeedClient />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Categories */}
            <TrendingCategories />

            {/* Quick Actions */}
            <div className="rounded-xl border border-fuchsia-500/30 bg-slate-900/70 p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(217,70,239,0.15)]">
              <h3 className="font-bold text-fuchsia-300 mb-4">Acțiuni rapide</h3>
              <div className="space-y-3">
                <Link href="/create-post" className="flex items-center gap-3 p-3 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 rounded-lg transition-colors">
                  <MessageSquare className="w-5 h-5 text-fuchsia-400" />
                  <span className="font-medium text-fuchsia-100">Creează postare</span>
                </Link>
                <Link href="/bookmarks" className="flex items-center gap-3 p-3 hover:bg-slate-800/80 rounded-lg transition-colors">
                  <Bookmark className="w-5 h-5 text-cyan-300" />
                  <span className="font-medium text-slate-200">Salvate</span>
                </Link>
                <Link href="/achievements" className="flex items-center gap-3 p-3 hover:bg-slate-800/80 rounded-lg transition-colors">
                  <Award className="w-5 h-5 text-emerald-300" />
                  <span className="font-medium text-slate-200">Realizări</span>
                </Link>
              </div>
            </div>

            {/* Events */}
            <div className="rounded-xl border border-emerald-500/30 bg-slate-900/70 p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <h3 className="font-bold text-emerald-300 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-300" />
                Evenimente
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <p className="font-medium text-emerald-100 text-sm">Tech Meetup</p>
                  <p className="text-xs text-emerald-300/80">Mâine, 19:00</p>
                </div>
                <div className="p-3 hover:bg-slate-800/80 rounded-lg">
                  <p className="font-medium text-emerald-100 text-sm">Webinar AI</p>
                  <p className="text-xs text-emerald-300/80">Vineri, 14:00</p>
                </div>
              </div>
            </div>

            {/* Recent/Active Users */}
            <RecentUsersWidget />
          </div>
        </section>
      </main>
      </div>
    </>
  );
}
