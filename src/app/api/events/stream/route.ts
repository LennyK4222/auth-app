export const dynamic = "force-dynamic";

import { addSSEClient, publish } from "@/lib/eventsHub";

export async function GET(req: Request) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Initial SSE headers
  const headers = new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    // Allow CORS for local dev if needed
    "Access-Control-Allow-Origin": "*",
  });

  // Send a hello event so client knows the stream is alive
  await writer.write(encoder.encode(`: connected ${Date.now()}\n\n`));

  const close = () => {
    try { writer.close(); } catch {}
  };
  const send = (frame: string) => writer.write(encoder.encode(frame));

  // Register client with hub
  const unsubscribe = addSSEClient(send, close);

  // Optionally announce new client
  publish({ type: "system", action: "client-joined" });

  // Close when client disconnects
  const abort = (req as any).signal as AbortSignal | undefined;
  if (abort) {
    abort.addEventListener("abort", () => {
      try { unsubscribe(); } catch {}
    }, { once: true });
  }

  return new Response(readable, { headers });
}
