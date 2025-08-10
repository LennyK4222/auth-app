import { NextRequest } from 'next/server';
import { addSubscriber } from '@/lib/commentsBus';

export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  let stopped = false;

  const send = async (data: unknown) => {
    if (stopped) return;
    try {
      await writer.write(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
      // writer likely closed
      stopped = true;
      try { writer.close(); } catch {}
    }
  };

  const unsubscribe = addSubscriber(id, (payload) => { void send(payload); });
  // initial hello
  await send({ type: 'connected', postId: id, ts: Date.now() });

  const onAbort = () => {
    if (stopped) return;
    stopped = true;
    try { unsubscribe(); } catch {}
    try { writer.close(); } catch {}
  };
  try { req.signal.addEventListener('abort', onAbort); } catch {}

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
