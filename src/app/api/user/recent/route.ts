import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { verifyAuthToken } from '@/lib/auth/jwt';

interface UserDoc {
  _id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  lastSeenAt?: Date;
}

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const limit = Math.min(Number(new URL(req.url).searchParams.get('limit') || 6), 24);
    // Try to identify the requester to guarantee inclusion
    let requesterId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      if (token) {
        const payload = await verifyAuthToken(token as string);
        requesterId = String(payload.sub || '');
      }
    } catch {}

    // Prefer users seen recently; then by last login and creation
    const users = await User.find({}, { email: 1, name: 1, avatar: 1, createdAt: 1, lastLoginAt: 1, lastSeenAt: 1 })
      .sort({ lastSeenAt: -1, lastLoginAt: -1, createdAt: -1 })
      .limit(limit)
      .lean() as unknown as UserDoc[];

    // Ensure the requester is present
    if (requesterId && !users.some(u => String(u._id) === requesterId)) {
      const me = await User.findById(requesterId, { email: 1, name: 1, avatar: 1, createdAt: 1, lastLoginAt: 1, lastSeenAt: 1 }).lean() as unknown as UserDoc;
      if (me) {
        users.unshift(me);
      }
    }
    const now = Date.now();
  const seen = new Set<string>();
  const list = users.map(u => ({
      id: String(u._id),
      name: u.name || null,
      email: u.email,
      avatar: u.avatar || null,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt || null,
      lastSeenAt: u.lastSeenAt || null,
      online: u.lastSeenAt ? (now - new Date(u.lastSeenAt).getTime() < 60_000) : false,
  }))
  // de-duplicate and enforce limit
  .filter(u => (seen.has(u.id) ? false : (seen.add(u.id), true)))
  .slice(0, limit);
  return NextResponse.json({ users: list });
  } catch (err) {
    console.error('recent users error', err);
    return NextResponse.json({ users: [] });
  }
}
