// Utilitar pentru broadcast live users
export const subscribers: Set<WritableStreamDefaultWriter<Uint8Array>> = new Set();

export function broadcast(users: unknown) {
  const enc = new TextEncoder();
  for (const writer of subscribers) {
    try {
      writer.write(enc.encode(`data: ${JSON.stringify(users)}\n\n`));
    } catch {
      try { writer.close(); } catch {}
      subscribers.delete(writer);
    }
  }
}
