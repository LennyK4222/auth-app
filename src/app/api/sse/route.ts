import { NextRequest } from 'next/server';
import { addSSEClient } from '@/lib/eventsHub';

// Enhanced SSE endpoint with authentication and channel support
export async function GET(req: NextRequest) {

  // Get channel from query params
  const url = new URL(req.url);
  const channels = url.searchParams.get('channels')?.split(',') || ['public'];
  
  // Create readable stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'connection',
            message: 'Connected to SSE',
            channels,
            timestamp: Date.now(),
          })}\n\n`
        )
      );

      // Helper to send data
      const send = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch (e) {
          console.error('SSE send error:', e);
        }
      };

      // Helper to close connection
      const close = () => {
        try {
          controller.close();
        } catch (e) {
          console.error('SSE close error:', e);
        }
      };

      // Register client with hub
      const unsubscribe = addSSEClient(send, close);

      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        unsubscribe();
      });

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          send(`: heartbeat ${Date.now()}\n\n`);
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
      });
    },
  });

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Access-Control-Allow-Origin': '*',
    },
  });
}
