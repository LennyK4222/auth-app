import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken } from '@/lib/auth/jwt';
import Link from 'next/link';
import { RecentUsersWidget } from '@/components/RecentUsersWidget';
import { Heartbeat } from '@/components/Heartbeat';
import Feed from '../components/Feed';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Heart, 
  Calendar,
  Star,
  Bookmark,
  Award,
  Zap,
  Globe,
  Code,
  Camera,
  Music,
  GamepadIcon,
  BookOpen,
  Briefcase,
  Car,
  Utensils,
  Plane
} from 'lucide-react';

// Ensure this page is always rendered dynamically so auth via cookies is fresh
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type JwtPayload = { sub: string; email: string; name?: string; exp?: number };

// Icon mapping pentru categorii
const iconMap: Record<string, any> = {
  'Code': Code,
  'Camera': Camera,
  'Music': Music,
  'GamepadIcon': GamepadIcon,
  'BookOpen': BookOpen,
  'Briefcase': Briefcase,
  'Car': Car,
  'Utensils': Utensils,
  'Plane': Plane,
  'Globe': Globe,
  'Tag': TrendingUp, // Default icon
};

async function getCategories() {
  try {
    await connectToDatabase();
    
    // Fetch categories from database
    const categories = await Category.find({ isActive: true })
      .select('name slug description color icon postCount')
      .sort({ name: 1 })
      .lean();

    // Map database categories to UI format with proper icons
    return categories.map(cat => ({
      name: cat.name,
      slug: cat.slug,
      count: cat.postCount > 0 ? 
        cat.postCount > 999 ? `${(cat.postCount/1000).toFixed(1)}k` : cat.postCount.toString() 
        : '0',
      color: cat.color,
      icon: iconMap[cat.icon] || TrendingUp,
      description: cat.description
    }));
  } catch (error) {
    console.error('Error fetching categories from database:', error);
    
    // Fallback to static categories if database fails
    return [
      { name: 'Tehnologie', slug: 'tehnologie', count: '2.1k', color: 'from-blue-500 to-indigo-600', icon: Code },
      { name: 'Fotografie', slug: 'fotografie', count: '890', color: 'from-purple-500 to-pink-600', icon: Camera },
      { name: 'Gaming', slug: 'gaming', count: '3.2k', color: 'from-red-500 to-orange-600', icon: GamepadIcon },
      { name: 'Muzică', slug: 'muzica', count: '1.5k', color: 'from-green-500 to-emerald-600', icon: Music },
      { name: 'Educație', slug: 'educatie', count: '756', color: 'from-yellow-500 to-amber-600', icon: BookOpen },
      { name: 'Business', slug: 'business', count: '942', color: 'from-slate-500 to-slate-600', icon: Briefcase },
    ];
  }
}

export default async function RootPage() {
  const cookieStore = await cookies();
  let token = cookieStore.get('token')?.value;
  if (!token) {
    const hdrs = await headers();
    const cookieHeader = hdrs.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    token = match ? decodeURIComponent(match[1]) : undefined;
  }
  if (!token) {
    const all = cookieStore.getAll().map(c => c.name);
    console.log('PAGE DEBUG: No token found on /, cookies:', all, 'cookie header length:', (await headers()).get('cookie')?.length || 0);
    redirect('/login');
  }

  try {
  await verifyAuthToken(token);
  const categories = await getCategories();
    
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
          <main className="relative mx-auto max-w-7xl px-4 py-8">
            <Heartbeat />

          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-8 shadow-lg dark:border-slate-800/80 dark:bg-slate-900/95">
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Descoperă comunitatea
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    Conectează-te, împărtășește și explorează împreună cu alții
                  </p>
                </div>
              </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/60 dark:bg-slate-900/60 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">1.2k</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Membri activi</p>
              </div>
              <div className="bg-white/60 dark:bg-slate-900/60 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">8.7k</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Discuții</p>
              </div>
              <div className="bg-white/60 dark:bg-slate-900/60 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">25k</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Aprecieri</p>
              </div>
              <div className="bg-white/60 dark:bg-slate-900/60 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">+15%</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Creștere</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Categorii populare</h2>
            <Link href="/categories" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium text-sm">
              Vezi toate →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/category/${category.slug}`}
                className="group relative overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{category.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">{category.count} postări</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Feed */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Feed recent</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-lg font-medium">
                  Trending
                </button>
                <button className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  Recent
                </button>
              </div>
            </div>
            <Feed />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 p-6 backdrop-blur-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Trending acum
              </h3>
              <div className="space-y-3">
                {[
                  { topic: 'Next.js 15', posts: '124 postări' },
                  { topic: 'AI & Machine Learning', posts: '89 postări' },
                  { topic: 'React Server Components', posts: '67 postări' },
                  { topic: 'TypeScript 5.0', posts: '45 postări' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">#{item.topic}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{item.posts}</p>
                    </div>
                    <Star className="w-4 h-4 text-yellow-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 p-6 backdrop-blur-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Acțiuni rapide</h3>
              <div className="space-y-3">
                <Link href="/create-post" className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-slate-900 dark:text-white">Creează postare</span>
                </Link>
                <Link href="/bookmarks" className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                  <Bookmark className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-900 dark:text-white">Salvate</span>
                </Link>
                <Link href="/achievements" className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                  <Award className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-900 dark:text-white">Realizări</span>
                </Link>
              </div>
            </div>

            {/* Events */}
            <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 p-6 backdrop-blur-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                Evenimente
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">Tech Meetup</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Mâine, 19:00</p>
                </div>
                <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">Webinar AI</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Vineri, 14:00</p>
                </div>
              </div>
            </div>
          </div>
        </section>
          </main>
          {/* Corner widget with recent/active users */}
          <RecentUsersWidget />
        </div>
      </>
    );
  } catch {
    redirect('/login');
  }
}
// Simplified homepage has no actions
