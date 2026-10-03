import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const consentValidationSchema = z.object({
  purpose: z.string().min(3).max(300).optional(),
  requestedScopes: z.array(z.string()).optional(),
  grantedScopes: z.array(z.string()).optional(),
  applicationId: z.string().regex(objectIdRegex, 'Invalid applicationId format').optional()
});

export const selectDocumentValidationSchema = z.object({
  applicationId: z.string().regex(objectIdRegex, 'Invalid applicationId format').optional()
});

export const attachDocumentValidationSchema = z.object({
  digilockerDocumentId: z.string().min(1, 'digilockerDocumentId is required').regex(objectIdRegex, 'Invalid digilockerDocumentId format'),
  docType: z.string().min(2, 'docType is required')
});

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

export const validateMongoIdParam = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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
