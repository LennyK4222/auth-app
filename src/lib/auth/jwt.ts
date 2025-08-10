import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';
import { validateSession } from '@/lib/sessions';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('[WARN] JWT_SECRET is not set; using insecure dev secret.');
}
const secret = new TextEncoder().encode(JWT_SECRET || 'dev-secret');
const issuer = process.env.JWT_ISSUER || 'auth-app';
const audience = process.env.JWT_AUDIENCE || 'auth-app-user';

export interface JWTPayload extends JoseJWTPayload {
  sub: string; // user id
  email: string;
  name?: string;
}

export async function signAuthToken(payload: JWTPayload) {
  const token = await new SignJWT(payload as JoseJWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime('7d')
    .sign(secret);
  return token;
}

export async function verifyAuthToken(token: string, requireSession = false) {
  try {
    const { payload } = await jwtVerify<JWTPayload>(token, secret, {
      issuer,
      audience,
    });
    
    // Validate session in database only if required
    if (requireSession) {
      const session = await validateSession(token);
      if (!session) {
        throw new Error('Session not found or expired');
      }
    }
    
    return payload;
  } catch (err) {
    console.error('JWT verify error:', err);
    throw err;
  }
}
