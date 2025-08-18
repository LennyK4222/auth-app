import { publish, type GlobalEvent } from "@/lib/eventsHub";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<GlobalEvent>;
    if (!body || typeof body !== "object" || !body.type) {
      return Response.json({ error: "Invalid payload: { type, action?, id?, payload? }" }, { status: 400 });
    }
    publish({
      type: String(body.type),
      action: body.action ? String(body.action) : undefined,
      id: body.id as any,
      payload: body.payload ?? null,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: "Bad JSON" }, { status: 400 });
  }
}
