import crypto from 'crypto';
import { env } from '../../config/env';

/**
 * AES-256-GCM encryption & OAuth Security Service
 */
export class DigiLockerSecurityService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes TTL
  private static readonly consumedStates: Map<string, number> = new Map();

  /**
   * Derive a 32-byte key from JWT_SECRET or env config
   */
  private static getEncryptionKey(): Buffer {
    const secret = env.JWT_SECRET || 'tn_welfarepath_super_secure_jwt_secret_key_2026';
    return crypto.createHash('sha256').update(secret).digest();
  }

  /**
   * Encrypt sensitive string data at rest using AES-256-GCM
   */
  public static encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.getEncryptionKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt sensitive encrypted text at rest
   */
  public static decrypt(cipherText: string): string {
    if (!cipherText || !cipherText.includes(':')) return '';
    try {
      const parts = cipherText.split(':');
      if (parts.length !== 3) return '';
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.getEncryptionKey(), iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('[DigiLockerSecurityService] Decryption failed:', err);
      return '';
    }
  }

  /**
   * Generate a cryptographically signed OAuth state parameter incorporating user identity and timestamp
   */
  public static generateSecureState(userId: string): string {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(12).toString('hex');
    const payload = `${userId}:${timestamp}:${nonce}`;
    const hmac = crypto.createHmac('sha256', this.getEncryptionKey()).update(payload).digest('hex');
    const stateStr = Buffer.from(`${payload}:${hmac}`).toString('base64url');
    return stateStr;
  }

  /**
   * Validates state signature, checks TTL expiration, and enforces one-time usage against replay attacks
   */
  public static validateAndConsumeState(stateStr: string): { valid: boolean; userId?: string; error?: string } {
    if (!stateStr) {
      return { valid: false, error: 'State parameter is missing.' };
    }

    // Check one-time replay consumption cache
    this.cleanExpiredStates();
    if (this.consumedStates.has(stateStr)) {
      return { valid: false, error: 'OAuth state parameter has already been consumed (Replay Attack blocked).' };
    }

    try {
      const raw = Buffer.from(stateStr, 'base64url').toString('utf8');
      const parts = raw.split(':');
      if (parts.length !== 4) {
        return { valid: false, error: 'Malformed state parameter format.' };
      }

      const [userId, timestampStr, nonce, receivedHmac] = parts;
      const timestamp = parseInt(timestampStr, 10);

      if (isNaN(timestamp)) {
        return { valid: false, error: 'Invalid state timestamp.' };
      }

      // 1. Verify HMAC Signature
      const expectedPayload = `${userId}:${timestampStr}:${nonce}`;
      const expectedHmac = crypto.createHmac('sha256', this.getEncryptionKey()).update(expectedPayload).digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expectedHmac))) {
        return { valid: false, error: 'State signature validation failed (Tampering detected).' };
      }

      // 2. Verify Expiration
      const age = Date.now() - timestamp;
      if (age > this.STATE_EXPIRY_MS || age < -5000) {
        return { valid: false, error: 'State parameter has expired.' };
      }

      // Mark state as consumed (One-time usage)
      this.consumedStates.set(stateStr, Date.now() + this.STATE_EXPIRY_MS);

      return { valid: true, userId };
    } catch (err) {
      return { valid: false, error: 'State validation error.' };
    }
  }

  /**
   * Periodically purge expired state tokens from replay memory
   */
  private static cleanExpiredStates(): void {
    const now = Date.now();
    for (const [state, expireAt] of this.consumedStates.entries()) {
      if (now > expireAt) {
        this.consumedStates.delete(state);
      }
    }
  }

  /**
   * Redacts sensitive strings (tokens, secrets, full Aadhaar numbers) from logs and outputs
   */
  public static sanitizeLogData(data: any): any {
    if (!data) return data;
    if (typeof data === 'string') {
      return data
        .replace(/(access_token|refreshToken|code)=[^&]+/gi, '$1=[REDACTED]')
        .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, 'XXXX-XXXX-XXXX');
    }
    if (typeof data === 'object') {
      const sanitized: Record<string, any> = Array.isArray(data) ? [] : {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('code') ||
          lowerKey.includes('password')
        ) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeLogData(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    return data;
  }
}
