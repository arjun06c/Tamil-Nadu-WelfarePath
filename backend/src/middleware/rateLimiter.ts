import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

interface RateLimitStoreEntry {
  count: number;
  resetTime: number;
}

const stores = new Map<string, Map<string, RateLimitStoreEntry>>();

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  storeName?: string;
}

/**
 * Clean in-memory sliding window rate-limiter middleware
 */
export const createRateLimiter = (options: RateLimiterOptions) => {
  const storeName = options.storeName || 'default';
  if (!stores.has(storeName)) {
    stores.set(storeName, new Map<string, RateLimitStoreEntry>());
  }
  const store = stores.get(storeName)!;

  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    const clientKey = authReq.user?.id || req.ip || req.headers['x-forwarded-for'] || 'anonymous_client';
    const now = Date.now();

    let entry = store.get(String(clientKey));

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + options.windowMs
      };
      store.set(String(clientKey), entry);
      next();
      return;
    }

    entry.count += 1;

    if (entry.count > options.maxRequests) {
      const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        status: 429,
        error: 'Too Many Requests',
        message: options.message || 'Too many requests to DigiLocker API. Please try again later.',
        retryAfterSeconds
      });
      return;
    }

    next();
  };
};

// Specialized DigiLocker Endpoint Rate Limiters
export const digilockerConnectLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  storeName: 'digilocker_connect',
  message: 'DigiLocker connection attempt limit exceeded. Please wait before retrying.'
});

export const digilockerCallbackLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  storeName: 'digilocker_callback',
  message: 'OAuth callback rate limit exceeded.'
});

export const digilockerDocumentLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 40,
  storeName: 'digilocker_documents',
  message: 'Document discovery rate limit exceeded. Please try again in a few minutes.'
});

export const digilockerRetrievalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  storeName: 'digilocker_retrieval',
  message: 'Document retrieval rate limit exceeded.'
});
