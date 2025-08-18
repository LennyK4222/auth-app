"use client";
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useCsrfContext } from '@/contexts/CsrfContext';
import ChatWidget from '@/components/ChatWidget';
import { MessageSquare, Shield, Terminal, LogOut, Settings, UserCircle, LogIn } from 'lucide-react';

export default function Navbar({ ssrIsAuthed = false }: { ssrIsAuthed?: boolean }) {
  const [hydrated, setHydrated] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Safe hooks with error handling
  let user = null;
  let isAuthenticated = false;
  let csrfToken = '';
  
  try {
    const auth = useAuth();
    user = auth?.user || null;
    isAuthenticated = auth?.isAuthenticated || false;
  } catch (error) {
    console.warn('Auth hook error:', error);
  }
  
  try {
    const csrf = useCsrfContext();
    csrfToken = csrf?.csrfToken || '';
  } catch (error) {
    console.warn('CSRF hook error:', error);
  }

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Lock to SSR values until hydration completes to avoid mismatches
  const authed = hydrated ? isAuthenticated : ssrIsAuthed;

  // Prevent hydration mismatch by not rendering until hydrated
  if (!hydrated) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-cyan-500/30 p-4" suppressHydrationWarning>
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="group flex items-center gap-2 text-xl font-bold font-mono"
            suppressHydrationWarning
          >
            <Terminal className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
            <span 
              className="text-cyan-300 group-hover:text-cyan-200 transition-all"
              style={{
                textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
                letterSpacing: '0.1em'
              }}
            >
              DED<span className="text-pink-400">SEC</span>
            </span>
          </Link>
          <div className="text-cyan-300 font-mono text-sm" suppressHydrationWarning>Initializing...</div>
        </div>
      </nav>
    );
  }

  return (
    <>
    <nav 
      className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-cyan-500/30 p-4" 
      suppressHydrationWarning
      style={{
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.1), inset 0 0 20px rgba(0, 255, 255, 0.05)'
      }}
    >
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo with cyberpunk styling */}
        <Link 
          href="/" 
          className="group flex items-center gap-2 text-xl font-bold font-mono"
          suppressHydrationWarning
        >
          <Terminal className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          <span 
            className="text-cyan-300 group-hover:text-cyan-200 transition-all"
            style={{
              textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
              letterSpacing: '0.1em'
            }}
          >
            DED<span className="text-pink-400">SEC</span>
          </span>
        </Link>
        
        {/* Navigation items with cyberpunk styling */}
        <div className="flex items-center gap-3">
          {authed ? (
            <>
              {/* Chat button */}
              <button
                onClick={() => setIsChatOpen(true)}
                className="group flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/50 rounded-lg text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-cyan-200 transition-all duration-300"
                style={{
                  boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)'
                }}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="font-mono text-sm">CHAT</span>
              </button>
              
              {/* Admin button with special styling */}
              {(user?.role === 'admin') && (
                <Link 
                  href="/admin" 
                  className="group flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/20 hover:border-red-400 hover:text-red-300 transition-all duration-300"
                  style={{
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  <Shield className="w-4 h-4" />
                  <span className="font-mono text-sm">ADMIN</span>
                </Link>
              )}
              
              {/* Settings link */}
              <Link 
                href="/settings" 
                className="group flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/50 rounded-lg text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 hover:text-purple-200 transition-all duration-300"
                style={{
                  boxShadow: '0 0 10px rgba(168, 85, 247, 0.2)'
                }}
              >
                <Settings className="w-4 h-4" />
                <span className="font-mono text-sm">CONFIG</span>
              </Link>
              
              {/* User info display */}
              <div className="flex items-center gap-2 px-3 py-2 border border-cyan-500/20 rounded-lg bg-cyan-500/5">
                <UserCircle className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs text-cyan-300" suppressHydrationWarning>
                  {user?.name || user?.email?.split('@')[0] || 'USER'}
                </span>
              </div>
              
              {/* Logout button */}
              <form action="/api/auth/logout" method="POST" className="inline">
                <input type="hidden" name="csrf" value={csrfToken || ''} suppressHydrationWarning />
                <button 
                  type="submit" 
                  className="group flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/50 rounded-lg text-pink-300 hover:bg-pink-500/20 hover:border-pink-400 hover:text-pink-200 transition-all duration-300"
                  style={{
                    boxShadow: '0 0 10px rgba(236, 72, 153, 0.2)'
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-mono text-sm">EXIT</span>
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Login button */}
              <Link 
                href="/login" 
                className="group flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/50 rounded-lg text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-cyan-200 transition-all duration-300"
                style={{
                  boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)'
                }}
              >
                <LogIn className="w-4 h-4" />
                <span className="font-mono text-sm">LOGIN</span>
              </Link>
              
              {/* Register button */}
              <Link 
                href="/register" 
                className="group flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/50 rounded-lg text-pink-300 hover:bg-pink-500/20 hover:border-pink-400 hover:text-pink-200 transition-all duration-300"
                style={{
                  boxShadow: '0 0 10px rgba(236, 72, 153, 0.2)'
                }}
              >
                <UserCircle className="w-4 h-4" />
                <span className="font-mono text-sm">REGISTER</span>
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* Animated bottom border */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        style={{
          animation: 'slideGlow 3s linear infinite'
        }}
      />
    </nav>
    
    {/* Add padding to body to account for fixed navbar */}
    <div className="h-[72px]" />
    
    <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    
    {/* Add custom animations */}
    <style jsx>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      @keyframes slideGlow {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
    </>
  );
}
