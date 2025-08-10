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
export async function getLocationFromIP(): Promise<LocationInfo | null> {
  try {
    // Aici poți integra cu un API precum ipapi.co, ipgeolocation.io, etc.
    // Pentru demo, returnez null
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
  expiresAt: Date
): Promise<ISession> {
  await connectToDatabase();
  
  const deviceInfo = {
    userAgent,
    ip,
    ...parseUserAgent(userAgent)
  };
  
  const location = await getLocationFromIP();
  
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
