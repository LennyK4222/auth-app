import type { NextRequest } from 'next/server';

// Validate CSRF via header 'x-csrf-token'
export async function validateCsrf(req: NextRequest) {
  const header = req.headers.get('x-csrf-token');
  
  console.log('CSRF validation:');
  console.log('- Header exists:', !!header);
  console.log('- Header length:', header?.length || 0);
  
  if (!header) {
    console.log('CSRF validation failed: missing header');
    return false;
  }
  
  // Check if it's a valid hex token of expected length (64 characters for 32 bytes)
  const isValidFormat = /^[a-f0-9]{64}$/i.test(header);
  
  console.log('CSRF validation result:', isValidFormat);
  return isValidFormat;
}
