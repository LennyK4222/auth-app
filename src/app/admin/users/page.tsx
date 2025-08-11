'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UsersManagement from '@/components/admin/UsersManagement';
import { useAuth } from '@/hooks/useAuth';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, hasRole } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!hasRole('admin')) {
      router.push('/');
    }
  }, [loading, isAuthenticated, hasRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasRole('admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Users Management</h1>
          <p className="text-blue-100">Manage and monitor all users in the system</p>
        </div>
        
        <UsersManagement />
      </div>
    </div>
  );
}
