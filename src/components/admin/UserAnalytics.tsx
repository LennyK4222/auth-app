'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface UserStats {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  newUsersToday: number;
  newUsersWeek: number;
  newUsersMonth: number;
  totalPosts: number;
  totalComments: number;
  averagePostsPerUser: number;
  topUsers: {
    _id: string;
    username: string;
    email: string;
    postsCount: number;
    commentsCount: number;
    joinDate: string;
    lastActive: string;
    avatar?: string;
  }[];
  userGrowth: {
    date: string;
    dateLabel: string;
    newUsers: number;
    activeUsers: number;
  }[];
}

export default function UserAnalytics() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/analytics', {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={fetchUserStats}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Analytics</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <p>Comprehensive user statistics and insights</p>
            {lastUpdated && (
              <>
                <span>•</span>
                <p>Last updated: {lastUpdated.toLocaleTimeString()}</p>
              </>
            )}
          </div>
        </div>
        <button
          onClick={fetchUserStats}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Total Users</p>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-100">Active Today</p>
              <p className="text-3xl font-bold text-white">{stats.activeUsersToday}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-100">New This Week</p>
              <p className="text-3xl font-bold text-white">{stats.newUsersWeek}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-100">Avg Posts/User</p>
              <p className="text-3xl font-bold text-white">{stats.averagePostsPerUser.toFixed(1)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow border border-gray-200"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Active Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.topUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar ? (
                          <Image
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.avatar}
                            alt={user.username}
                            width={40}
                            height={40}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.postsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {user.commentsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.joinDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Growth Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200"
      >
        <div className="px-6 py-4 border-b border-gray-200 bg-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              User Growth (Last 7 Days)
            </h3>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
              Real-time data
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-5">
            {stats.userGrowth.map((day, index) => {
              const maxUsers = Math.max(...stats.userGrowth.map(d => Math.max(d.newUsers, d.activeUsers)));
              const newUsersWidth = maxUsers > 0 ? (day.newUsers / maxUsers) * 100 : 0;
              const activeUsersWidth = maxUsers > 0 ? (day.activeUsers / maxUsers) * 100 : 0;
              
              return (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-800 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      {day.dateLabel}
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">New Users</div>
                        <div className="text-sm font-bold text-purple-600">{day.newUsers}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Active Users</div>
                        <div className="text-sm font-bold text-green-600">{day.activeUsers}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>New Users</span>
                        <span>{day.newUsers}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${newUsersWidth}%` }}
                          transition={{ delay: (index * 0.1) + 0.3, duration: 0.8 }}
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full shadow-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Active Users</span>
                        <span>{day.activeUsers}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${activeUsersWidth}%` }}
                          transition={{ delay: (index * 0.1) + 0.5, duration: 0.8 }}
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Summary Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.userGrowth.reduce((sum, day) => sum + day.newUsers, 0)}
                </div>
                <div className="text-sm text-purple-700 font-medium">Total New Users</div>
                <div className="text-xs text-purple-600 mt-1">Last 7 days</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(...stats.userGrowth.map(day => day.activeUsers))}
                </div>
                <div className="text-sm text-green-700 font-medium">Peak Active Users</div>
                <div className="text-xs text-green-600 mt-1">Daily maximum</div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(stats.userGrowth.reduce((sum, day) => sum + day.activeUsers, 0) / stats.userGrowth.length)}
                </div>
                <div className="text-sm text-blue-700 font-medium">Avg Active Users</div>
                <div className="text-xs text-blue-600 mt-1">Daily average</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
