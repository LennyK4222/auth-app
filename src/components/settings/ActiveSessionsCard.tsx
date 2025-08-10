'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface SessionInfo {
  id: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    browser?: string;
    os?: string;
    device?: string;
  };
  location?: {
    country?: string;
    city?: string;
  };
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

export default function ActiveSessionsCard() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/user/sessions');
      
      if (response.status === 401) {
        // Try to migrate existing session
        const migrateResponse = await fetch('/api/auth/migrate-session', {
          method: 'POST'
        });
        
        if (migrateResponse.ok) {
          // Retry fetching sessions after migration
          const retryResponse = await fetch('/api/user/sessions');
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setSessions(data.sessions);
            return;
          }
        }
        
        toast.error('Please log in again to see sessions');
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      toast.error('Failed to load sessions');
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    if (terminating) return;
    
    setTerminating(sessionId);
    
    try {
      const response = await fetch(`/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to terminate session');
      
      const data = await response.json();
      
      if (sessionId === 'all') {
        toast.success(`${data.terminatedCount} sessions terminated`);
      } else {
        toast.success('Session terminated');
      }
      
      // Refresh sessions list
      fetchSessions();
    } catch (error) {
      toast.error('Failed to terminate session');
      console.error('Error terminating session:', error);
    } finally {
      setTerminating(null);
    }
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getDeviceIcon = (device?: string) => {
    switch (device) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      default: return '💻';
    }
  };

  const getBrowserIcon = (browser?: string) => {
    if (!browser) return '🌐';
    const b = browser.toLowerCase();
    if (b.includes('chrome')) return '🌐';
    if (b.includes('firefox')) return '🦊';
    if (b.includes('safari')) return '🧭';
    if (b.includes('edge')) return '🌐';
    return '🌐';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Active Sessions</h3>
        {sessions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => terminateSession('all')}
            disabled={terminating === 'all'}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {terminating === 'all' ? 'Terminating...' : 'End All Other Sessions'}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`border rounded-lg p-4 ${
              session.isCurrent ? 'bg-green-50 border-green-200' : 'bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {getDeviceIcon(session.deviceInfo.device)}
                  </span>
                  <span className="text-lg">
                    {getBrowserIcon(session.deviceInfo.browser)}
                  </span>
                  <div>
                    <div className="font-medium">
                      {session.deviceInfo.browser || 'Unknown Browser'} on{' '}
                      {session.deviceInfo.os || 'Unknown OS'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.deviceInfo.device || 'Desktop'} • {session.deviceInfo.ip}
                      {session.location?.city && ` • ${session.location.city}`}
                      {session.location?.country && `, ${session.location.country}`}
                    </div>
                  </div>
                  {session.isCurrent && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  Last activity: {formatLastActivity(session.lastActivity)}
                </div>
              </div>

              {!session.isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => terminateSession(session.id)}
                  disabled={terminating === session.id}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {terminating === session.id ? 'Ending...' : 'End Session'}
                </Button>
              )}
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No active sessions found
          </div>
        )}
      </div>
    </Card>
  );
}
