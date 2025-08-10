'use client';

import { useState } from 'react';

export default function PromoteToAdmin() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const promoteUser = async () => {
    if (!email) {
      setMessage('Please enter an email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Success: ${data.message}`);
        setMessage('✅ Promoted! Redirecting to login to refresh session...');
        
        // Logout and redirect to login to get new token
        setTimeout(async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.href = '/login';
        }, 2000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Promote to Admin
        </h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white mb-2">Email address:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:border-white/60"
              placeholder="user@example.com"
            />
          </div>
          
          <button
            onClick={promoteUser}
            disabled={loading}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Promoting...' : 'Promote to Admin'}
          </button>
          
          {message && (
            <div className="p-4 rounded-lg bg-white/10 border border-white/20">
              <p className="text-white text-sm">{message}</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <a href="/admin" className="text-blue-200 hover:text-blue-100 underline">
            Go to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
