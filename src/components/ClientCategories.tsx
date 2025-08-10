"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/hooks/useApp';
import { 
  TrendingUp, 
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

// Icon mapping pentru client side
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
  'Tag': TrendingUp, // Default icon
};

interface Category {
  name: string;
  slug: string;
  count: string;
  color: string;
  icon: string; // Schimbat la string
  description?: string;
}

interface ClientCategoriesProps {
  initialCategories: Category[];
}

export function ClientCategories({ initialCategories }: ClientCategoriesProps) {
  const { state, updateCategories } = useApp();

  useEffect(() => {
    if (state.categories.length === 0) {
      updateCategories(initialCategories);
    }
  }, [initialCategories, state.categories.length, updateCategories]);

  const categories = state.categories.length > 0 ? state.categories : initialCategories;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((category) => {
        const IconComponent = iconMap[category.icon] || TrendingUp;
        return (
          <Link
            key={category.name}
            href={`/category/${category.slug}`}
            className="group relative overflow-hidden rounded-xl p-4 text-center transition-all hover:scale-105 hover:shadow-xl"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{category.name}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">{category.count} postări</p>
          </Link>
        );
      })}
    </div>
  );
}
