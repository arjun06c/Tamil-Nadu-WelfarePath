import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  uploadDocumentFile,
  getDocumentMetadata,
  streamDocumentFile,
  replaceDocumentOnCorrection
} from '../controllers/documentController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Setup Multer Storage
const UPLOAD_DIR = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Document Endpoints
router.post('/upload', authenticateJWT, upload.single('file'), uploadDocumentFile);
router.get('/:id/file', streamDocumentFile);
router.get('/:id/download', (req, res, next) => {
  req.query.download = 'true';
  next();
}, streamDocumentFile);
router.get('/:id', authenticateJWT, getDocumentMetadata);
router.post('/:id/replace', authenticateJWT, replaceDocumentOnCorrection);

export default router;
