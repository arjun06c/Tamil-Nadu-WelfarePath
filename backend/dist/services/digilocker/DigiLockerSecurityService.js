"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigiLockerSecurityService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../config/env");
/**
 * AES-256-GCM encryption & OAuth Security Service
 */
class DigiLockerSecurityService {
    static ALGORITHM = 'aes-256-gcm';
    static STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes TTL
    static consumedStates = new Map();
    /**
     * Derive a 32-byte key from JWT_SECRET or env config
     */
    static getEncryptionKey() {
        const secret = env_1.env.JWT_SECRET || 'tn_welfarepath_super_secure_jwt_secret_key_2026';
        return crypto_1.default.createHash('sha256').update(secret).digest();
    }
    /**
     * Encrypt sensitive string data at rest using AES-256-GCM
     */
    static encrypt(text) {
        if (!text)
            return '';
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(this.ALGORITHM, this.getEncryptionKey(), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }
    /**
     * Decrypt sensitive encrypted text at rest
     */
    static decrypt(cipherText) {
        if (!cipherText || !cipherText.includes(':'))
            return '';
        try {
            const parts = cipherText.split(':');
            if (parts.length !== 3)
                return '';
            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            const decipher = crypto_1.default.createDecipheriv(this.ALGORITHM, this.getEncryptionKey(), iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (err) {
            console.error('[DigiLockerSecurityService] Decryption failed:', err);
            return '';
        }
    }
    /**
     * Generate a cryptographically signed OAuth state parameter incorporating user identity and timestamp
     */
    static generateSecureState(userId) {
        const timestamp = Date.now();
        const nonce = crypto_1.default.randomBytes(12).toString('hex');
        const payload = `${userId}:${timestamp}:${nonce}`;
        const hmac = crypto_1.default.createHmac('sha256', this.getEncryptionKey()).update(payload).digest('hex');
        const stateStr = Buffer.from(`${payload}:${hmac}`).toString('base64url');
        return stateStr;
    }
    /**
     * Validates state signature, checks TTL expiration, and enforces one-time usage against replay attacks
     */
    static validateAndConsumeState(stateStr) {
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
            const expectedHmac = crypto_1.default.createHmac('sha256', this.getEncryptionKey()).update(expectedPayload).digest('hex');
            if (!crypto_1.default.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expectedHmac))) {
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
        }
        catch (err) {
            return { valid: false, error: 'State validation error.' };
        }
    }
    /**
     * Periodically purge expired state tokens from replay memory
     */
    static cleanExpiredStates() {
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
    static sanitizeLogData(data) {
        if (!data)
            return data;
        if (typeof data === 'string') {
            return data
                .replace(/(access_token|refreshToken|code)=[^&]+/gi, '$1=[REDACTED]')
                .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, 'XXXX-XXXX-XXXX');
        }
        if (typeof data === 'object') {
            const sanitized = Array.isArray(data) ? [] : {};
            for (const [key, value] of Object.entries(data)) {
                const lowerKey = key.toLowerCase();
                if (lowerKey.includes('secret') ||
                    lowerKey.includes('token') ||
                    lowerKey.includes('code') ||
                    lowerKey.includes('password')) {
                    sanitized[key] = '[REDACTED]';
                }
                else if (typeof value === 'object' && value !== null) {
                    sanitized[key] = this.sanitizeLogData(value);
                }
                else {
                    sanitized[key] = value;
                }
            }
            return sanitized;
        }
        return data;
    }
}
exports.DigiLockerSecurityService = DigiLockerSecurityService;
