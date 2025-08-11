import type { NextRequest } from 'next/server';

export function getClientIp(req: NextRequest): string {
  const xf = req.headers.get('cf-connecting-ip')
    || req.headers.get('x-vercel-forwarded-for')
    || req.headers.get('x-forwarded-for')
    || req.headers.get('x-real-ip')
    || req.headers.get('x-client-ip')
    || req.headers.get('true-client-ip')
    || '';
  const first = xf.split(',')[0]?.trim();
  return first && first.length > 0 ? first : 'unknown';
}

export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || '';
}
