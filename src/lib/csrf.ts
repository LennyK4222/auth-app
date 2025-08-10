import type { NextRequest } from 'next/server';

// Validate CSRF via header 'x-csrf-token'
export async function validateCsrf(req: NextRequest) {
  const header = req.headers.get('x-csrf-token');
  
  if (!header) {
    return false;
  }
  
  // Check if it's a valid hex token of expected length (64 characters for 32 bytes)
  const isValidFormat = /^[a-f0-9]{64}$/i.test(header);
  
  return isValidFormat;
}
