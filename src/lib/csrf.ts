import type { NextRequest } from 'next/server';

// Validate CSRF via header and cookie comparison
export async function validateCsrf(req: NextRequest) {
  const headerToken = req.headers.get('x-csrf-token') || req.headers.get('X-CSRF-Token');
  const cookieToken = req.cookies.get('csrf')?.value;
  
  if (!headerToken || !cookieToken) {
    return false;
  }
  
  // Check if tokens match and are valid format
  const isValidFormat = /^[a-f0-9]{64}$/i.test(headerToken);
  const tokensMatch = headerToken === cookieToken;
  
  return isValidFormat && tokensMatch;
}
