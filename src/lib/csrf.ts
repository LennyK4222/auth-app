import { cookies } from 'next/headers';

// Validate CSRF via header and cookie comparison
export async function validateCsrf(req: Request) {
  const headerToken = req.headers.get('x-csrf-token') || req.headers.get('X-CSRF-Token');

  // Read cookie using Next.js header cookies API for route handlers
  let cookieToken: string | undefined;
  try {
    const cookieStore = await cookies();
    cookieToken = cookieStore.get('csrf')?.value;
  } catch {
    cookieToken = undefined;
  }

  // Fallback: parse Cookie header manually (Edge or special runtimes)
  if (!cookieToken) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)csrf=([^;]+)/i);
    if (match) {
      try { cookieToken = decodeURIComponent(match[1]); } catch { cookieToken = match[1]; }
    }
  }

  if (!headerToken || !cookieToken) return false;

  // Check if tokens match and are valid hex(64)
  const isValidFormat = /^[a-f0-9]{64}$/i.test(headerToken);
  const tokensMatch = headerToken === cookieToken;
  return isValidFormat && tokensMatch;
}
