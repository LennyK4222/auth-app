import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken } from '@/lib/auth/jwt';
import Link from 'next/link';
import Image from 'next/image';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
import { Post } from '@/models/Post';

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

// Interface for transformed post data used in component
interface TransformedPost {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  score: number;
  votes: number;
  author: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}
import { 
  MessageSquare, 
  Heart, 
  Calendar,
  TrendingUp,
  Clock,
  User as UserIcon,
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
import CreateThreadModal from '../../../components/CreateThreadModal';

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
        sortQuery = { 'votesCount': -1, createdAt: -1 };
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
        color: category.color,
        icon: category.icon,
        postCount: category.postCount
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
          _id: post.authorId?._id?.toString(),
          name: post.authorId?.name || 'Anonim',
          email: post.authorId?.email,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Categoria nu a fost găsită</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
            ← Înapoi la pagina principală
          </Link>
        </div>
      </div>
    );
  }

  const { category, posts } = categoryData;
  const IconComponent = iconMap[category.icon] || TrendingUp;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      
      <main className="relative mx-auto max-w-7xl px-4 py-8">
        {/* Header cu categoria */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi la pagina principală
          </Link>
          
          <div className={`bg-gradient-to-r ${category.color} rounded-2xl p-6 text-white shadow-xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <IconComponent className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{category.name}</h1>
                  {category.description && (
                    <p className="text-white/90 mt-2">{category.description}</p>
                  )}
                  <p className="text-white/80 text-sm mt-1">
                    {category.postCount} {category.postCount === 1 ? 'thread' : 'thread-uri'}
                  </p>
                </div>
              </div>
              
              <CreateThreadModal categorySlug={category.slug} categoryName={category.name} />
            </div>
          </div>
        </div>

        {/* Sort options */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            <Link 
              href={`/category/${slug}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                !sort || sort === 'recent' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Recent
            </Link>
            <Link 
              href={`/category/${slug}?sort=hot`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                sort === 'hot' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Popular
            </Link>
            <Link 
              href={`/category/${slug}?sort=top`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                sort === 'top' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Heart className="w-4 h-4 inline mr-2" />
              Top
            </Link>
          </div>
        </div>

        {/* Posts list */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center shadow-sm">
              <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Încă nu există thread-uri în această categorie
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Fii primul care începe o discuție!
              </p>
              <CreateThreadModal categorySlug={category.slug} categoryName={category.name} />
            </div>
          ) : (
            posts.map((post: TransformedPost) => (
              <div key={post._id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link href={`/thread/${post._id}`} className="block">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">
                        {post.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                        {post.content}
                      </p>
                    </Link>
                    
                    <div className="flex items-center space-x-4 mt-4 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-2">
                        {post.author.avatar ? (
                          <Image 
                            src={post.author.avatar} 
                            alt={post.author.name}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <UserIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <span>{post.author.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.createdAt).toLocaleDateString('ro-RO')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{post.votes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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
