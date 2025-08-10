import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { verifyAuthToken } from '@/lib/auth/jwt';

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
        requesterId = String((payload as any).sub || '');
      }
    } catch {}

    // Prefer users seen recently; then by last login and creation
    const users = await User.find({}, { email: 1, name: 1, avatar: 1, createdAt: 1, lastLoginAt: 1, lastSeenAt: 1 })
      .sort({ lastSeenAt: -1, lastLoginAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // Ensure the requester is present
    if (requesterId && !users.some(u => String((u as any)._id) === requesterId)) {
      const me = await User.findById(requesterId, { email: 1, name: 1, avatar: 1, createdAt: 1, lastLoginAt: 1, lastSeenAt: 1 }).lean();
      if (me) {
        users.unshift(me as any);
      }
    }
    const now = Date.now();
  const seen = new Set<string>();
  const list = users.map(u => ({
      id: String((u as any)._id),
      name: (u as any).name || null,
      email: (u as any).email,
      avatar: (u as any).avatar || null,
      createdAt: (u as any).createdAt,
      lastLoginAt: (u as any).lastLoginAt || null,
      lastSeenAt: (u as any).lastSeenAt || null,
      online: (u as any).lastSeenAt ? (now - new Date((u as any).lastSeenAt).getTime() < 60_000) : false,
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
