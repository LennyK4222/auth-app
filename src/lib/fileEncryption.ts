import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.FILE_ENCRYPTION_KEY || 'your-32-character-secret-key!!';
const IV_LENGTH = 16; // For AES, this is always 16

export function encryptFilename(filename: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(filename, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error encrypting filename:', error);
    // Fallback to base64 encoding if encryption fails
    return Buffer.from(filename).toString('base64url');
  }
}

export function decryptFilename(encryptedFilename: string): string {
  try {
    if (!encryptedFilename.includes(':')) {
      // Fallback: assume it's base64url encoded
      return Buffer.from(encryptedFilename, 'base64url').toString('utf8');
    }
    
    const [, encrypted] = encryptedFilename.split(':');
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Error decrypting filename:', error);
    // Return the original if decryption fails
    return encryptedFilename;
  }
}

export function hashFilename(filename: string): string {
  return crypto.createHash('sha256').update(filename).digest('hex').substring(0, 16);
}

export function isValidFilename(filename: string): boolean {
  // Check for valid filename format
  const validPattern = /^[a-zA-Z0-9\-_]+\.(jpg|jpeg|png|gif|webp|svg)$/i;
  return validPattern.test(filename);
}
