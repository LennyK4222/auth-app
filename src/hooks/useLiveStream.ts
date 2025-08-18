import { useEffect, useRef } from "react"
import { subscribeSharedSSE } from "@/lib/sseLeader"

/**
 * Minimal standard event shape; servers can emit any JSON. Keep it flexible.
 */
export type LiveEvent = any

/**
 * Subscribes to a shared SSE stream and invokes the handler for each message.
 * Ensures cleanup on unmount and shields JSON parsing errors.
 */
export function useLiveStream(
  url: string,
  onEvent: (evt: LiveEvent) => void,
  deps: any[] = []
) {
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    if (!url) return
    const unsubscribe = subscribeSharedSSE(url, (e) => {
      try {
        const raw = (e as MessageEvent).data as unknown as string
        if (!raw) return
        const data = JSON.parse(raw)
        handlerRef.current?.(data)
      } catch {
        // ignore malformed payloads
      }
    })
    return () => {
      try { unsubscribe() } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps])
}
