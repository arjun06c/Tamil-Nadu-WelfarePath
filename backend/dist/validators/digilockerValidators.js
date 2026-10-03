"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMongoIdParam = exports.validateBody = exports.attachDocumentValidationSchema = exports.selectDocumentValidationSchema = exports.consentValidationSchema = void 0;
const zod_1 = require("zod");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
exports.consentValidationSchema = zod_1.z.object({
    purpose: zod_1.z.string().min(3).max(300).optional(),
    requestedScopes: zod_1.z.array(zod_1.z.string()).optional(),
    grantedScopes: zod_1.z.array(zod_1.z.string()).optional(),
    applicationId: zod_1.z.string().regex(objectIdRegex, 'Invalid applicationId format').optional()
});
exports.selectDocumentValidationSchema = zod_1.z.object({
    applicationId: zod_1.z.string().regex(objectIdRegex, 'Invalid applicationId format').optional()
});
exports.attachDocumentValidationSchema = zod_1.z.object({
    digilockerDocumentId: zod_1.z.string().min(1, 'digilockerDocumentId is required').regex(objectIdRegex, 'Invalid digilockerDocumentId format'),
    docType: zod_1.z.string().min(2, 'docType is required')
});
const validateBody = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(422).json({
                status: 422,
                error: 'Unprocessable Entity',
                message: 'Invalid input validation payload',
                details: result.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
            });
            return;
        }
        req.body = result.data;
        next();
    };
};
exports.validateBody = validateBody;
const validateMongoIdParam = (paramName) => {
    return (req, res, next) => {
        const idValue = req.params[paramName];
        if (!idValue || typeof idValue !== 'string' || !objectIdRegex.test(idValue)) {
            res.status(400).json({
                status: 400,
                error: 'Bad Request',
                message: `Invalid parameters: '${paramName}' must be a valid 24-character hex ID.`
            });
            return;
        }
        next();
    };
};
exports.validateMongoIdParam = validateMongoIdParam;
