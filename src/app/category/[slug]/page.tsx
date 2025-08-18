import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken } from '@/lib/auth/jwt';
import Link from 'next/link';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
import { Post } from '@/models/Post';
import CyberpunkBackground from '@/components/CyberpunkBackground';
import HolographicDisplay from '@/components/HolographicDisplay';
import CategoryFeedClient from '@/components/CategoryFeedClient';
import CreateThreadModal from '../../../components/CreateThreadModal';
import { 
  TrendingUp,
  ArrowLeft,
  Code,
  Camera,
  Music,
  GamepadIcon,
  BookOpen,
  Briefcase,
  Car,
  Utensils,
  Plane,
  Globe
} from 'lucide-react';

// TypeScript interfaces for lean() query results
interface CategoryLean {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  postCount: number;
  isActive: boolean;
}

interface PostLean {
  _id: string;
  title: string;
  body?: string;
  category: string;
  createdAt: Date;
  score?: number;
  votes?: Record<string, number>;
  authorId: {
    _id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
}

// Ensure this page is always rendered dynamically
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Icon mapping pentru categorii
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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
  'Tag': TrendingUp,
};

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

async function getCategoryWithPosts(slug: string, sort: string = 'recent') {
  try {
    await connectToDatabase();
    
    // Get category
    const category = await Category.findOne({ slug, isActive: true }).lean() as unknown as CategoryLean;
    if (!category) return null;

    // Sort logic
    let sortQuery = {};
    switch (sort) {
      case 'hot':
        sortQuery = { score: -1, createdAt: -1 };
        break;
      case 'top':
        sortQuery = { score: -1, createdAt: -1 }; // Changed from 'votesCount' to 'score'
        break;
      default: // recent
        sortQuery = { createdAt: -1 };
    }

    // Get posts from this category
    const posts = await Post.find({ category: category.slug })
      .sort(sortQuery)
      .limit(20)
      .populate('authorId', 'name email avatar')
      .lean() as unknown as PostLean[];

    return {
      category: {
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color || '#3b82f6', // Default color if not set
        icon: category.icon || 'Tag', // Default icon if not set
        postCount: category.postCount || 0
      },
      posts: posts.map((post: PostLean) => ({
        _id: post._id.toString(),
        title: post.title,
        content: (post.body || '').substring(0, 150) + ((post.body || '').length > 150 ? '...' : ''),
        category: post.category,
        createdAt: post.createdAt.toISOString(),
        score: post.score || 0,
        votes: Object.keys(post.votes || {}).length,
        author: {
          _id: post.authorId?._id?.toString() || post.authorId?.toString(),
          name: post.authorId?.name || 'Anonim',
          email: post.authorId?.email || '',
          avatar: post.authorId?.avatar
        }
      }))
    };
  } catch (error) {
    console.error('Error fetching category data:', error);
    return null;
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  // Auth check
  const cookieStore = await cookies();
  let token = cookieStore.get('token')?.value;
  if (!token) {
    const hdrs = await headers();
    const cookieHeader = hdrs.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    token = match ? decodeURIComponent(match[1]) : undefined;
  }
  if (!token) {
    redirect('/login');
  }

  try {
    await verifyAuthToken(token);
  } catch {
    redirect('/login');
  }

  const { slug } = await params;
  const { sort } = await searchParams;
  
  const categoryData = await getCategoryWithPosts(slug, sort);
  if (!categoryData) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <CyberpunkBackground />
        <div className="relative flex items-center justify-center min-h-screen">
          <HolographicDisplay>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-cyan-300 mb-4 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                Categoria nu a fost găsită
              </h1>
              <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                ← Înapoi la pagina principală
              </Link>
            </div>
          </HolographicDisplay>
        </div>
      </div>
    );
  }

  const { category, posts } = categoryData;
  const IconComponent = iconMap[category.icon] || TrendingUp;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <CyberpunkBackground />
      
      <main className="relative container mx-auto px-4 py-8">
        {/* Header cu categoria */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors mb-4 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Înapoi la pagina principală
          </Link>
          
          <HolographicDisplay>
            <div className="rounded-2xl p-6 shadow-[0_0_30px_rgba(34,211,238,0.3)] border border-cyan-500/50 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-cyan-500/20 rounded-lg backdrop-blur-sm border border-cyan-400/30">
                    <IconComponent className="w-8 h-8 text-cyan-300" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                      {category.name}
                    </h1>
                    {category.description && (
                      <p className="text-cyan-100/90 mt-2">{category.description}</p>
                    )}
                    <p className="text-cyan-200/80 text-sm mt-1">
                      {category.postCount} {category.postCount === 1 ? 'thread' : 'thread-uri'}
                    </p>
                  </div>
                </div>
                
                <CreateThreadModal categorySlug={category.slug} categoryName={category.name} />
              </div>
            </div>
          </HolographicDisplay>
        </div>

        {/* Posts list with client-side functionality */}
        <CategoryFeedClient 
          initialPosts={posts}
          categorySlug={category.slug}
          initialSort={sort}
        />
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  
  try {
    await connectToDatabase();
    const category = await Category.findOne({ slug, isActive: true }).lean() as unknown as CategoryLean;
    
    if (!category) {
      return { title: 'Categoria nu a fost găsită' };
    }

    return {
      title: `${category.name} - Thread-uri și Discuții`,
      description: category.description || `Explorează thread-urile din categoria ${category.name}`
    };
  } catch {
    return { title: 'Categoria nu a fost găsită' };
  }
}
