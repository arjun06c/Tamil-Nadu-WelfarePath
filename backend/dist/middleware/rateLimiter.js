"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.digilockerRetrievalLimiter = exports.digilockerDocumentLimiter = exports.digilockerCallbackLimiter = exports.digilockerConnectLimiter = exports.createRateLimiter = void 0;
const stores = new Map();
/**
 * Clean in-memory sliding window rate-limiter middleware
 */
const createRateLimiter = (options) => {
    const storeName = options.storeName || 'default';
    if (!stores.has(storeName)) {
        stores.set(storeName, new Map());
    }
    const store = stores.get(storeName);
    return (req, res, next) => {
        const authReq = req;
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
exports.createRateLimiter = createRateLimiter;
// Specialized DigiLocker Endpoint Rate Limiters
exports.digilockerConnectLimiter = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    maxRequests: 15,
    storeName: 'digilocker_connect',
    message: 'DigiLocker connection attempt limit exceeded. Please wait before retrying.'
});
exports.digilockerCallbackLimiter = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    maxRequests: 15,
    storeName: 'digilocker_callback',
    message: 'OAuth callback rate limit exceeded.'
});
exports.digilockerDocumentLimiter = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    maxRequests: 40,
    storeName: 'digilocker_documents',
    message: 'Document discovery rate limit exceeded. Please try again in a few minutes.'
});
exports.digilockerRetrievalLimiter = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    maxRequests: 20,
    storeName: 'digilocker_retrieval',
    message: 'Document retrieval rate limit exceeded.'
});
