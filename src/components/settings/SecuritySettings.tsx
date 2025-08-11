"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useCsrfContext } from '@/contexts/CsrfContext';
import { 
  Key, 
  Smartphone, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Monitor,
  RefreshCw
} from 'lucide-react';

interface User {
  sub: string;
  email: string;
  name?: string;
}

interface SecuritySettingsProps {
  user: User;
}

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

export function SecuritySettings({}: SecuritySettingsProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const { csrfToken, isLoading: csrfLoading, refreshToken: refreshCsrf } = useCsrfContext();
  
  // Sessions state
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [terminating, setTerminating] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState(0);

  // Load sessions on component mount
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
      setSessionsLoading(false);
    }
  };

  // Ensure we have a CSRF token before making a mutating request
  const ensureCsrf = async (): Promise<string | null> => {
    // Prefer in-memory token
    if (csrfToken && /^[a-f0-9]{64}$/i.test(csrfToken)) return csrfToken;
    // Fallback to cookie
    try {
      const fromCookie = document.cookie.split('; ').find(c => c.startsWith('csrf='))?.split('=')[1];
      if (fromCookie && /^[a-f0-9]{64}$/i.test(decodeURIComponent(fromCookie))) {
        return decodeURIComponent(fromCookie);
      }
    } catch {}
    // Refresh via context
    try {
      await refreshCsrf();
    } catch {}
    // Try cookie again after refresh
    try {
      const fromCookie2 = document.cookie.split('; ').find(c => c.startsWith('csrf='))?.split('=')[1];
      if (fromCookie2 && /^[a-f0-9]{64}$/i.test(decodeURIComponent(fromCookie2))) {
        return decodeURIComponent(fromCookie2);
      }
    } catch {}
    return null;
  };

  const terminateSession = async (sessionId: string) => {
    if (terminating) return;
    
    setTerminating(sessionId);
    
    try {
      const token = await ensureCsrf();
      if (!token) {
        toast.error('Nu s-a putut obține token-ul CSRF');
        return;
      }

      const doRequest = async () => fetch(`/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': token,
        },
        credentials: 'include',
      });

      let response = await doRequest();
      if (response.status === 403) {
        // refresh csrf and retry once
        try { await refreshCsrf(); } catch {}
        const token2 = await ensureCsrf();
        if (token2) {
          response = await fetch(`/api/user/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-CSRF-Token': token2,
            },
            credentials: 'include',
          });
        }
      }

      if (!response.ok) {
        const errBody: unknown = await response.json().catch(() => ({}));
        const msg = (errBody && typeof errBody === 'object' && 'error' in errBody)
          ? String((errBody as { error?: unknown }).error ?? 'Failed to terminate session')
          : 'Failed to terminate session';
        throw new Error(msg);
      }

      const data = await response.json();

      if (sessionId === 'all') {
        toast.success(`${data.terminatedCount} sessions terminated`);
      } else {
        toast.success('Session terminated');
      }

      // Refresh sessions list
      fetchSessions();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to terminate session';
      toast.error(msg);
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

    if (diffMins < 1) return 'Acum';
    if (diffMins < 60) return `${diffMins} minute ago`;
    if (diffHours < 24) return `${diffHours} ore ago`;
    return `${diffDays} zile ago`;
  };

  const getDeviceIcon = (device?: string) => {
    switch (device) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      default: return '💻';
    }
  };

  const formatIp = (ip?: string) => {
    if (!ip) return 'necunoscut';
    // Normalize IPv6-mapped IPv4
    const m = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (m) return m[1];
    if (ip === '::1') return '127.0.0.1';
    return ip;
  };

  const isPrivateIp = (ip?: string) => {
    if (!ip) return true;
    const v4 = formatIp(ip);
    if (!v4) return true;
    if (v4 === 'necunoscut') return true;
    if (v4.startsWith('10.')) return true;
    if (v4.startsWith('192.168.')) return true;
    if (v4.startsWith('172.')) {
      const second = parseInt(v4.split('.')[1] || '0', 10);
      if (second >= 16 && second <= 31) return true;
    }
    if (v4.startsWith('127.')) return true;
    // Simple IPv6 private/link-local checks on the original string
    if (ip.startsWith('fc') || ip.startsWith('fd')) return true;
    if (ip.startsWith('fe80:')) return true;
    return false;
  };

  const countryFlag = (country?: string) => {
    if (!country) return null;
    const code = country.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return null;
    const base = 127397; // regional indicator symbol letter A
    try {
      return String.fromCodePoint(
        ...code.split('').map(c => c.charCodeAt(0) + base)
      );
    } catch {
      return null;
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (field === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordData.currentPassword.trim()) {
      toast.error('Te rog să introduci parola curentă');
      return;
    }
    
    if (!passwordData.newPassword.trim()) {
      toast.error('Te rog să introduci o parolă nouă');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Parola nouă trebuie să aibă minim 6 caractere');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Parolele nu se potrivesc');
      return;
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('Parola nouă trebuie să fie diferită de cea curentă');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Attempting to change password...');
      
      let res, data;
      
      try {
        res = await fetch('/api/user/change-password', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'X-CSRF-Token': csrfToken
          },
          credentials: 'include',
          body: JSON.stringify({ 
            currentPassword: passwordData.currentPassword, 
            newPassword: passwordData.newPassword 
          }),
        });
        
        console.log('Response status:', res.status);
        console.log('Response ok:', res.ok);
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error('Nu s-a putut conecta la server');
      }
      
      try {
        data = await res.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        data = {};
      }
      
      if (!res.ok) {
        const errorMessage = data?.error || `Eroare server (${res.status})`;
        console.log('Server error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('Password change successful');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength(0);
      toast.success('Parola a fost schimbată cu succes');
    } catch (error) {
      console.error('Error changing password:', error);
      const msg = error instanceof Error ? error.message : 'Eroare neașteptată la schimbarea parolei';
      console.log('Showing error toast:', msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 25) return 'bg-red-500';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 25) return 'Slabă';
    if (strength < 50) return 'Medie';
    if (strength < 75) return 'Bună';
    return 'Foarte bună';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Change Password */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Schimbă parola
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Actualizează parola pentru o securitate sporită
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Parola curentă
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  placeholder="Parola ta actuală"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Parola nouă
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  placeholder="Parola ta nouă"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Puterea parolei: {getPasswordStrengthText(passwordStrength)}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {passwordStrength}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirmă parola nouă
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  placeholder="Confirmă parola nouă"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <AlertCircle size={14} />
                  Parolele nu se potrivesc
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePasswordSubmit}
              disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-400 text-white rounded-xl font-medium transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Key size={16} />
              )}
              {loading ? 'Se actualizează...' : 'Actualizează parola'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Autentificare în două etape
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Protejează-ți contul cu un cod de securitate
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  twoFactorEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
          </div>

          {twoFactorEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  Autentificarea în două etape este activată
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw size={16} />
                Regenerează codurile de backup
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Sesiuni active
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gestionează dispozitivele conectate
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {sessionsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nu s-au găsit sesiuni active
              </div>
            ) : (
              <>
        {sessions.length > 1 && (
                  <div className="flex justify-end mb-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => terminateSession('all')}
          disabled={terminating === 'all' || csrfLoading}
                      className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      {terminating === 'all' ? 'Se închid...' : 'Închide toate celelalte sesiuni'}
                    </motion.button>
                  </div>
                )}
                
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-xl border ${
                      session.isCurrent 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                        : 'border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${session.isCurrent ? 'bg-green-500' : 'bg-slate-400'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getDeviceIcon(session.deviceInfo.device)}</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {session.deviceInfo.browser || 'Browser necunoscut'} pe {session.deviceInfo.os || 'OS necunoscut'}
                            </span>
                            {session.isCurrent && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                Sesiunea curentă
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <span>{session.deviceInfo.device || 'Desktop'}</span>
                            {(session.location?.city || session.location?.country) && (
                              <div className="flex items-center gap-1">
                                <MapPin size={12} />
                                {session.location?.city}
                                {session.location?.country && (
                                  <>
                                    {session.location?.city ? ', ' : ''}
                                    {countryFlag(session.location.country) && (
                                      <span title={session.location.country}>{countryFlag(session.location.country)}</span>
                                    )}
                                    <span>{session.location.country}</span>
                                  </>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-1" suppressHydrationWarning>
                              <Clock size={12} />
                              {formatLastActivity(session.lastActivity)}
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            IP: {formatIp(session.deviceInfo.ip)}{isPrivateIp(session.deviceInfo.ip) ? ' • Rețea privată' : ''}
                          </div>
                        </div>
                      </div>
            {!session.isCurrent && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => terminateSession(session.id)}
              disabled={terminating === session.id || csrfLoading}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {terminating === session.id ? 'Se închide...' : 'Deconectează'}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Login Notifications */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Notificări de conectare
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Primește alerte când cineva se conectează la contul tău
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLoginNotifications(!loginNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                loginNotifications ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  loginNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
