"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigiLockerDocument = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const DigiLockerDocumentSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Application' },
    source: { type: String, default: 'DIGILOCKER' },
    documentReference: { type: String, required: true },
    documentType: { type: String, required: true },
    name: {
        en: { type: String, required: true },
        ta: { type: String, required: true }
    },
    issuer: { type: String, required: true },
    issueDate: { type: String, default: '' },
    retrievedAt: { type: Date },
    mimeType: { type: String, default: 'application/pdf' },
    status: {
        type: String,
        enum: ['AVAILABLE', 'SELECTED', 'RETRIEVED', 'REVOKED'],
        default: 'AVAILABLE'
    },
    verificationStatus: {
        type: String,
        enum: ['PENDING_OFFICER_REVIEW', 'VERIFIED', 'CORRECTION_REQUIRED'],
        default: 'PENDING_OFFICER_REVIEW'
    },
    metadata: { type: Object, default: {} }
}, { timestamps: true });
exports.DigiLockerDocument = mongoose_1.default.model('DigiLockerDocument', DigiLockerDocumentSchema);
