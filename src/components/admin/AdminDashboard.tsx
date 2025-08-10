"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Tag,
  Settings,
  BarChart3,
  Shield,
  Database,
  Activity,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

// Import components explicitly
import UsersManagement from '@/components/admin/UsersManagement';
import { CategoriesManagement } from '@/components/admin/CategoriesManagement';
import { PostsManagement } from '@/components/admin/PostsManagement';
import { SystemSettings } from '@/components/admin/SystemSettings';
import UserAnalytics from '@/components/admin/UserAnalytics';

interface Admin {
  userId: string;
  email: string;
  name?: string;
  role: string;
}

interface AdminDashboardProps {
  admin: Admin;
}

type Tab = 'overview' | 'users' | 'posts' | 'categories' | 'analytics' | 'settings';

export function AdminDashboard({}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs = [
    { id: 'overview', label: 'Prezentare generală', icon: BarChart3 },
    { id: 'analytics', label: 'Statistici utilizatori', icon: TrendingUp },
    { id: 'users', label: 'Utilizatori', icon: Users },
    { id: 'posts', label: 'Postări', icon: MessageSquare },
    { id: 'categories', label: 'Categorii', icon: Tag },
    { id: 'settings', label: 'Setări sistem', icon: Settings },
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'analytics':
        return <UserAnalytics />;
      case 'users':
        return <UsersManagement />;
      case 'posts':
        return <PostsManagement />;
      case 'categories':
        return <CategoriesManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  );
}

function OverviewTab() {
  const stats = [
    {
      label: 'Utilizatori totali',
      value: '1,234',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      label: 'Postări totale',
      value: '8,456',
      change: '+8%',
      changeType: 'positive' as const,
      icon: MessageSquare,
    },
    {
      label: 'Utilizatori activi azi',
      value: '89',
      change: '-2%',
      changeType: 'negative' as const,
      icon: Activity,
    },
    {
      label: 'Rapoarte în așteptare',
      value: '3',
      change: 'Nou',
      changeType: 'warning' as const,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="mt-4">
                <span
                  className={`text-sm font-medium ${
                    stat.changeType === 'positive'
                      ? 'text-green-600 dark:text-green-400'
                      : stat.changeType === 'negative'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">
                  față de luna trecută
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Acțiuni rapide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors">
            <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              Revizuiește rapoarte
            </span>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              Backup baza de date
            </span>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              Configurări sistem
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
