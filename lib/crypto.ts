import crypto from 'crypto';

// Generates 32-character high-entropy cryptographic seed
export function generateSecureSeed(): string {
  return crypto.randomBytes(16).toString('hex'); // 32 characters
}

// Generates human-readable 6-character redirection code (A-Z, 2-9, non-ambiguous)
export function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// Generates unique browser session identifier
export function generateSessionId(): string {
  return 'sess_' + crypto.randomBytes(16).toString('hex');
}

// Generates creator cookie secret
export function generateCreatorCookie(): string {
  return 'ov_owner_' + crypto.randomBytes(24).toString('hex');
}

// Hash cookie string for DB indexing
export function hashCookie(cookieVal: string): string {
  return crypto.createHash('sha256').update(cookieVal).digest('hex');
}
