"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  Tag,
  Save,
  X,
  Palette
} from 'lucide-react';
import { useCsrfToken } from '@/hooks/useCsrfToken';

interface Category {
  _id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description?: string;
  postCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { csrfToken } = useCsrfToken();

  // Fetch categories from API
  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/categories');
        const data = await response.json();
        
        if (response.ok) {
          setCategories(data.categories || []);
        } else {
          console.error('Error fetching categories:', data.error);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Create new category
  const handleCreateCategory = async (categoryData: Omit<Category, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(categoryData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setCategories(prev => [...prev, data.category]);
        setShowCreateForm(false);
      } else {
        console.error('Error creating category:', data.error);
        alert(data.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  // Update existing category
  const handleUpdateCategory = async (categoryData: Category) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(categoryData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setCategories(prev => prev.map(c => c._id === categoryData._id ? data.category : c));
        setEditingCategory(null);
      } else {
        console.error('Error updating category:', data.error);
        alert(data.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  // Delete category
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setCategories(prev => prev.filter(c => c._id !== id));
      } else {
        console.error('Error deleting category:', data.error);
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  // Toggle category active status
  const handleToggleActive = async (category: Category) => {
    try {
      const response = await fetch(`/api/admin/categories/${category._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          ...category,
          isActive: !category.isActive
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setCategories(prev => prev.map(c => 
          c._id === category._id ? { ...c, isActive: !c.isActive } : c
        ));
      } else {
        console.error('Error toggling category:', data.error);
        alert(data.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error toggling category:', error);
      alert('Failed to update category');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Management categorii
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Administrează categoriile platformei
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adaugă categorie
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          onSave={(categoryData) => {
            if (editingCategory) {
              handleUpdateCategory(categoryData as Category);
            } else {
              handleCreateCategory(categoryData);
            }
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <CategoryCard
            key={category._id}
            category={category}
            onEdit={() => setEditingCategory(category)}
            onDelete={() => handleDeleteCategory(category._id)}
            onToggleActive={() => handleToggleActive(category)}
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function CategoryCard({ category, onEdit, onDelete, onToggleActive }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
          <Tag className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {category.name}
      </h3>
      
      {category.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {category.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">
          {category.postCount} postări
        </span>
        <button
          onClick={onToggleActive}
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            category.isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
          }`}
        >
          {category.isActive ? 'Activă' : 'Inactivă'}
        </button>
      </div>
    </motion.div>
  );
}

interface CategoryFormProps {
  category?: Category | null;
  onSave: (category: Omit<Category, '_id' | 'createdAt' | 'updatedAt'> | Category) => void;
  onCancel: () => void;
}

function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || 'from-blue-500 to-indigo-600',
    icon: category?.icon || 'Tag',
    isActive: category?.isActive ?? true
  });

  const iconOptions = [
    'Code', 'Camera', 'Music', 'GamepadIcon', 'BookOpen', 'Briefcase', 
    'Car', 'Utensils', 'Plane', 'Globe', 'Tag'
  ];

  const colorOptions = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-emerald-600',
    'from-red-500 to-orange-600',
    'from-yellow-500 to-amber-600',
    'from-slate-500 to-slate-600'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    if (category) {
      // Editing existing category
      onSave({
        ...category,
        name: formData.name,
        slug,
        color: formData.color,
        icon: formData.icon,
        description: formData.description,
        isActive: formData.isActive,
      });
    } else {
      // Creating new category
      onSave({
        name: formData.name,
        slug,
        color: formData.color,
        icon: formData.icon,
        description: formData.description,
        postCount: 0,
        isActive: formData.isActive,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {category ? 'Editează categoria' : 'Adaugă categorie nouă'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nume categorie
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Culoare
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} border-2 ${
                    formData.color === color ? 'border-slate-400' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Icon
            </label>
            <select
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              {iconOptions.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Descriere
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Categorie activă
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            {category ? 'Actualizează' : 'Creează'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            Anulează
          </button>
        </div>
      </form>
    </motion.div>
  );
}
