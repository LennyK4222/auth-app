import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ChatMessage } from '@/models/ChatMessage';
import { decryptMessage } from '@/lib/chatCrypto';

export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
  try {
    await connectToDatabase();
    const recent = await ChatMessage.find({}).sort({ createdAt: -1 }).limit(30).lean();
    type LeanChat = { _id: unknown; createdAt: Date; userId?: unknown; userName: string; userAvatar?: string | null; message?: string; iv?: string; ciphertext?: string };
    const items = (recent as unknown as LeanChat[]).reverse().map((m) => {
      let text = m.message || '';
      if (m.ciphertext && m.iv) {
        try { text = decryptMessage(m.iv, m.ciphertext); } catch {}
      }
      return {
        id: String(m._id),
        ts: new Date(m.createdAt).getTime(),
        user: { id: String(m.userId || ''), name: m.userName, avatar: m.userAvatar || null },
        message: text,
        type: 'chat' as const,
      };
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}


