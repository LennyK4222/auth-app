"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, Star } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}

export default function TrendingCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          // Sort by post count (if available) or alphabetically
          const sortedCategories = data.categories?.sort((a: Category, b: Category) => {
            if (a.postCount && b.postCount) {
              return b.postCount - a.postCount;
            }
            return a.name.localeCompare(b.name);
          }) || [];
          setCategories(sortedCategories.slice(0, 6)); // Show top 6 categories
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-cyan-500/30 bg-slate-900/70 p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.15)]">
        <h3 className="font-bold text-cyan-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Categorii populare
        </h3>
        <div className="space-y-3">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded mb-2"></div>
            <div className="h-3 bg-slate-800 rounded mb-2"></div>
            <div className="h-4 bg-slate-700 rounded mb-2"></div>
            <div className="h-3 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-cyan-500/30 bg-slate-900/70 p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.15)]">
        <h3 className="font-bold text-cyan-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Categorii populare
        </h3>
        <div className="text-slate-400 text-sm">
          Nu există categorii încă
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-slate-900/70 p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.15)]">
      <h3 className="font-bold text-cyan-300 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-cyan-400" />
        Categorii populare
      </h3>
      <div className="space-y-3">
        {categories.map((category, index) => (
          <div 
            key={category._id} 
            className="flex items-center justify-between p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors group"
            onClick={() => window.location.href = `/category/${category.slug}`}
          >
            <div>
              <p className="font-medium text-cyan-200 text-sm group-hover:text-white transition-colors">
                #{category.name}
              </p>
              <p className="text-xs text-slate-400">
                {category.postCount ? `${category.postCount} postări` : 'Fără postări'}
              </p>
            </div>
            <Star className={`w-4 h-4 transition-colors ${
              index < 3 ? 'text-yellow-400' : 'text-cyan-400'
            }`} />
          </div>
        ))}
      </div>
    </div>
  );
}






