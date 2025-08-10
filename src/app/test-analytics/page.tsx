'use client';

import UserAnalytics from '@/components/admin/UserAnalytics';

export default function TestAnalytics() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Test User Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Test componenta de analytics pentru utilizatori
          </p>
        </div>
        
        <UserAnalytics />
      </div>
    </div>
  );
}
