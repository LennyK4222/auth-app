import { cookies } from 'next/headers';
import { validateCsrf } from '../csrf';
import { verifyAuthToken, JWTPayload } from './jwt';
import { NextRequest } from 'next/server';

export interface AuthResult {
  csrfOk: boolean;
  token: string | null;
  user: JWTPayload | null;
  error: string | null;
}

export async function validateRequest(req: NextRequest, requireAuth = true, requireCsrf = true): Promise<AuthResult> {
  // CSRF validation
  let csrfOk = true;
  if (requireCsrf) {
    csrfOk = await validateCsrf(req);
    if (!csrfOk) {
      return { csrfOk, token: null, user: null, error: 'CSRF invalid' };
    }
  }

  // JWT validation
  let token: string | null = null;
  let user: JWTPayload | null = null;
  if (requireAuth) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value || null;
      if (!token) return { csrfOk, token: null, user: null, error: 'Unauthorized' };
      user = await verifyAuthToken(token);
    } catch {
      return { csrfOk, token: null, user: null, error: 'Unauthorized' };
    }
  }

  return { csrfOk, token, user, error: null };
}
