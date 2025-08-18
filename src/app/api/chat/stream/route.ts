import { NextRequest, NextResponse } from 'next/server';
import { chatSubscribers } from '@/lib/chatBus';
import { connectToDatabase } from '@/lib/db';
import { ChatMessage } from '@/models/ChatMessage';
import { decryptMessage } from '@/lib/chatCrypto';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';

export const revalidate = 0;

export async function GET(req: NextRequest) {
  // Require authenticated user
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return new NextResponse('Unauthorized', { status: 401 });
    await verifyAuthToken(token, true);
  } catch {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Ensure set exists and add subscriber
  chatSubscribers.add(writer);

  // Initial heartbeat to open the stream
  writer.write(new TextEncoder().encode(`: ping\n\n`));

  // Send recent history (last 30 messages)
  try {
    await connectToDatabase();
    const recent = await ChatMessage.find({}).sort({ createdAt: -1 }).limit(30).lean();
    const encoder = new TextEncoder();
    for (let i = recent.length - 1; i >= 0; i--) {
      const m = recent[i] as unknown as { message?: string; iv?: string; ciphertext?: string; createdAt: Date; userId?: unknown; userName: string; userAvatar?: string | null };
      let text = m.message || '';
      if (m.ciphertext && m.iv) {
        try { text = decryptMessage(m.iv, m.ciphertext); } catch {}
      }
      const payload = {
        type: 'chat' as const,
        ts: new Date(m.createdAt).getTime(),
        user: { id: String(m.userId || ''), name: m.userName, avatar: m.userAvatar || null },
        message: text,
      };
      try { await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)); } catch {}
    }
  } catch {}
  const interval = setInterval(() => {
    try { writer.write(new TextEncoder().encode(`: ping\n\n`)); } catch {}
  }, 15000);

  req.signal.addEventListener('abort', () => {
    clearInterval(interval);
    try { writer.close(); } catch {}
    chatSubscribers.delete(writer);
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}



