"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const documentController_1 = require("../controllers/documentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Setup Multer Storage
const UPLOAD_DIR = path_1.default.join(__dirname, '../../uploads/documents');
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path_1.default.extname(file.originalname) || '.pdf';
        cb(null, `doc-${uniqueSuffix}${ext}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});
// Document Endpoints
router.post('/upload', authMiddleware_1.authenticateJWT, upload.single('file'), documentController_1.uploadDocumentFile);
router.get('/:id/file', documentController_1.streamDocumentFile);
router.get('/:id/download', (req, res, next) => {
    req.query.download = 'true';
    next();
}, documentController_1.streamDocumentFile);
router.get('/:id', authMiddleware_1.authenticateJWT, documentController_1.getDocumentMetadata);
router.post('/:id/replace', authMiddleware_1.authenticateJWT, documentController_1.replaceDocumentOnCorrection);
exports.default = router;
