"use client";
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CommentsLiveClient({ postId }: { postId: string }) {
  const router = useRouter();
  const lastRef = useRef(0);
  useEffect(() => {
    const es = new EventSource(`/api/posts/${postId}/comments/stream`);
    const onMsg = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.type === 'comments-changed') {
          // soft refresh to re-render server components without full reload
          const now = Date.now();
          if (now - lastRef.current > 300) {
            lastRef.current = now;
            router.refresh();
          }
        }
      } catch {}
    };
    es.addEventListener('message', onMsg);
    return () => {
      es.removeEventListener('message', onMsg);
      es.close();
    };
  }, [postId, router]);
  return null;
}
