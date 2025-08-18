import { publish } from '@/lib/eventsHub';

// Helper function to publish events from other parts of the app
export function publishSSEEvent(event: {
  type: string;
  action?: string;
  data?: unknown;
  channel?: string;
  userId?: string;
}) {
  publish({
    type: event.type,
    action: event.action,
    payload: event.data,
    id: event.userId,
    ts: Date.now()
  });
}
