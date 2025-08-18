// Simple in-memory SSE hub for a single Node.js process.
// Other API routes can import { publish } to broadcast events.

export type GlobalEvent = {
  type: string;
  action?: string;
  id?: string | number;
  payload?: any;
  ts?: number;
};

type Client = {
  id: number;
  send: (text: string) => void;
  close: () => void;
};

class EventsHub {
  private clients = new Map<number, Client>();
  private nextId = 1;
  private pingTimer: NodeJS.Timeout | null = null;

  addClient(send: (text: string) => void, close: () => void) {
    const id = this.nextId++;
    const client: Client = { id, send, close };
    this.clients.set(id, client);
    this.ensurePing();
    return () => this.removeClient(id);
  }

  private removeClient(id: number) {
    const c = this.clients.get(id);
    if (c) {
      try { c.close(); } catch {}
      this.clients.delete(id);
    }
    if (this.clients.size === 0) this.clearPing();
  }

  publish(evt: GlobalEvent) {
    const payload = JSON.stringify({ ...evt, ts: evt.ts ?? Date.now() });
    const frame = `data: ${payload}\n\n`;
    for (const c of this.clients.values()) {
      try { c.send(frame); } catch {}
    }
  }

  private ensurePing() {
    if (this.pingTimer) return;
    this.pingTimer = setInterval(() => {
      const frame = `: ping ${Date.now()}\n\n`;
      for (const c of this.clients.values()) {
        try { c.send(frame); } catch {}
      }
    }, 15000);
  }

  private clearPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

const hub = new EventsHub();

export function publish(evt: GlobalEvent) {
  hub.publish(evt);
}

export function addSSEClient(send: (text: string) => void, close: () => void) {
  return hub.addClient(send, close);
}
