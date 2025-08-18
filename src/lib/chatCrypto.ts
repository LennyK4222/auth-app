import crypto from 'crypto';

const ALG = 'aes-256-gcm';

function getKey(): Buffer {
  const raw = process.env.CHAT_ENC_KEY || '';
  if (!raw) {
    // Dev fallback (DO NOT use in production without setting CHAT_ENC_KEY)
    const dev = crypto.createHash('sha256').update('dev-chat-key').digest();
    return dev;
  }
  // Allow base64 or hex
  try {
    if (/^[A-Za-z0-9+/=]+$/.test(raw) && raw.length >= 44) {
      const b = Buffer.from(raw, 'base64');
      if (b.length === 32) return b;
    }
  } catch {}
  try {
    const b = Buffer.from(raw, 'hex');
    if (b.length === 32) return b;
  } catch {}
  // As last resort, hash whatever was provided to 32 bytes
  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptMessage(plaintext: string): { iv: string; ciphertext: string } {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store ciphertext||tag together
  const payload = Buffer.concat([enc, tag]).toString('base64');
  return { iv: iv.toString('base64'), ciphertext: payload };
}

export function decryptMessage(ivB64: string, payloadB64: string): string {
  const key = getKey();
  const iv = Buffer.from(ivB64, 'base64');
  const payload = Buffer.from(payloadB64, 'base64');
  const tag = payload.subarray(payload.length - 16);
  const enc = payload.subarray(0, payload.length - 16);
  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}



