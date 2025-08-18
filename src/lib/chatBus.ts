// Simple in-memory broadcaster for live chat messages (singleton across HMR)
const g = globalThis as unknown as { __chatSubscribers?: Set<WritableStreamDefaultWriter<Uint8Array>> };
if (!g.__chatSubscribers) {
  g.__chatSubscribers = new Set<WritableStreamDefaultWriter<Uint8Array>>();
}
export const chatSubscribers: Set<WritableStreamDefaultWriter<Uint8Array>> = g.__chatSubscribers;

export function broadcastChat(payload: unknown) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
  for (const writer of chatSubscribers) {
    try {
      writer.write(data);
    } catch {
      try { writer.close(); } catch {}
      chatSubscribers.delete(writer);
    }
  }
}



