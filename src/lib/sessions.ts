import { Session, ISession } from '@/models/Session';
import { connectToDatabase } from '@/lib/db';
import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  userAgent: string;
  ip: string;
  browser?: string;
  os?: string;
  device?: string;
}

export interface LocationInfo {
  country?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Parse user agent pentru informații despre device
export function parseUserAgent(userAgent: string): Partial<DeviceInfo> {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  return {
    browser: result.browser.name || undefined,
    os: result.os.name || undefined,
    device: result.device.type || 'desktop'
  };
}

// Obține informații despre locație pe baza IP-ului (placeholder - poți integra cu un API real)
function normalizeIPv4Mapped(ip?: string | null): string | null {
  if (!ip) return null;
  const m = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (m) return m[1];
  if (ip === '::1') return '127.0.0.1';
  return ip;
}

function isPrivateIp(ip?: string | null): boolean {
  if (!ip) return true;
  const v4 = normalizeIPv4Mapped(ip);
  if (!v4) return true;
  if (v4 === 'unknown') return true;
  if (v4.startsWith('10.')) return true;
  if (v4.startsWith('192.168.')) return true;
  // 172.16.0.0 – 172.31.255.255
  if (v4.startsWith('172.')) {
    const second = parseInt(v4.split('.')[1] || '0', 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (v4.startsWith('127.')) return true;
  // Simple IPv6 private/link-local checks
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // unique local
  if (ip.startsWith('fe80:')) return true; // link-local
  return false;
}

export async function getLocationFromIP(ip: string): Promise<LocationInfo | null> {
  try {
    const norm = normalizeIPv4Mapped(ip);
    if (!norm || isPrivateIp(norm)) return null;

    // Prefer ipinfo if token set, else use ipapi.co
    const ipinfoToken = process.env.IPINFO_TOKEN;

    if (ipinfoToken) {
      const res = await fetch(`https://ipinfo.io/${encodeURIComponent(norm)}?token=${ipinfoToken}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json() as { city?: string; country?: string; loc?: string };
        let lat: number | undefined;
        let lng: number | undefined;
        if (data.loc && data.loc.includes(',')) {
          const [la, lo] = data.loc.split(',');
          lat = Number(la);
          lng = Number(lo);
        }
        return {
          city: data.city,
          country: data.country,
          coordinates: (lat !== undefined && lng !== undefined) ? { lat, lng } : undefined,
        };
      }
    }

    // Fallback to ipapi.co
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(norm)}/json/`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json() as { city?: string; country?: string; country_name?: string; latitude?: number; longitude?: number };
      const country = data.country_name || data.country;
      const lat = typeof data.latitude === 'number' ? data.latitude : undefined;
      const lng = typeof data.longitude === 'number' ? data.longitude : undefined;
      return {
        city: data.city,
        country,
        coordinates: (lat !== undefined && lng !== undefined) ? { lat, lng } : undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

// Creează o nouă sesiune
export async function createSession(
  userId: string,
  token: string,
  userAgent: string,
  ip: string,
  expiresAt: Date,
  locationOverride?: LocationInfo | null
): Promise<ISession> {
  await connectToDatabase();
  
  const deviceInfo = {
    userAgent,
    ip,
    ...parseUserAgent(userAgent)
  };
  
  const location = locationOverride ?? await getLocationFromIP(ip);
  
  const session = new Session({
    userId,
    token,
    deviceInfo,
    location,
    expiresAt,
    lastActivity: new Date()
  });
  
  return await session.save();
}

// Actualizează activitatea unei sesiuni
export async function updateSessionActivity(token: string): Promise<void> {
  await connectToDatabase();
  await Session.updateOne(
    { token, isActive: true },
    { lastActivity: new Date() }
  );
}

// Update session fingerprint (IP/UA/location) together with activity
export async function updateSessionActivityDetailed(
  token: string,
  userAgent: string,
  ip: string,
  location?: LocationInfo | null
): Promise<void> {
  await connectToDatabase();
  const ua = parseUserAgent(userAgent);
  const existing = await Session.findOne({ token, isActive: true }).select('deviceInfo.ip');
  if (!existing) return;

  let loc: LocationInfo | null | undefined = location;
  const ipChanged = ip && existing.deviceInfo?.ip !== ip;
  if (!loc && ipChanged && !isPrivateIp(ip)) {
    try { loc = await getLocationFromIP(ip); } catch { /* noop */ }
  }

  const update: Record<string, unknown> = {
    lastActivity: new Date(),
    'deviceInfo.userAgent': userAgent,
    'deviceInfo.ip': ip,
  };
  if (ua.browser) update['deviceInfo.browser'] = ua.browser;
  if (ua.os) update['deviceInfo.os'] = ua.os;
  if (ua.device) update['deviceInfo.device'] = ua.device;
  if (loc) update['location'] = loc;

  await Session.updateOne(
    { token, isActive: true },
    { $set: update }
  );
}

// Obține toate sesiunile active ale unui utilizator
export async function getUserActiveSessions(userId: string): Promise<ISession[]> {
  await connectToDatabase();
  return await Session.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActivity: -1 });
}

// Închide o sesiune specifică
export async function terminateSession(sessionId: string, userId: string): Promise<boolean> {
  await connectToDatabase();
  const result = await Session.updateOne(
    { _id: sessionId, userId },
    { isActive: false }
  );
  return result.modifiedCount > 0;
}

// Închide toate sesiunile unui utilizator (except sesiunea curentă)
export async function terminateAllOtherSessions(userId: string, currentToken: string): Promise<number> {
  await connectToDatabase();
  const result = await Session.updateMany(
    { 
      userId, 
      token: { $ne: currentToken },
      isActive: true 
    },
    { isActive: false }
  );
  return result.modifiedCount;
}

// Curăță sesiunile expirate
export async function cleanupExpiredSessions(): Promise<number> {
  await connectToDatabase();
  const result = await Session.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { lastActivity: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 30 zile
    ]
  });
  return result.deletedCount;
}

// Verifică dacă o sesiune este validă
export async function validateSession(token: string): Promise<ISession | null> {
  await connectToDatabase();
  const session = await Session.findOne({
    token,
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
  
  if (session) {
    // Actualizează ultima activitate
    await updateSessionActivity(token);
  }
  
  return session;
}
