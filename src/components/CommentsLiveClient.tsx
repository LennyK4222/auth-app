"use client";
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveStream } from "@/hooks/useLiveStream";

export default function CommentsLiveClient({ postId }: { postId: string }) {
  const router = useRouter();
  const lastRef = useRef(0);
  useLiveStream(`/api/posts/${postId}/comments/stream`, (data) => {
    if (data?.type === 'comments-changed') {
      // soft refresh to re-render server components without full reload
      const now = Date.now();
      if (now - lastRef.current > 300) {
        lastRef.current = now;
        router.refresh();
      }
    }
  }, [postId]);
  return null;
}
