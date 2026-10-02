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
exports.Scheme = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SchemeSchema = new mongoose_1.Schema({
    schemeCode: { type: String, required: true, unique: true },
    name: {
        en: { type: String, required: true },
        ta: { type: String, required: true }
    },
    department: {
        en: { type: String, required: true },
        ta: { type: String, required: true }
    },
    domainKey: { type: String, required: true },
    description: {
        en: { type: String, required: true },
        ta: { type: String, required: true }
    },
    benefitSummary: {
        en: { type: String, required: true },
        ta: { type: String, required: true }
    },
    targetBeneficiaries: {
        en: { type: String, default: 'General Citizens' },
        ta: { type: String, default: 'பொது மக்கள்' }
    },
    rules: { type: Object, required: true },
    requiredDocuments: [
        {
            docType: { type: String, required: true },
            isMandatory: { type: Boolean, default: true },
            label: {
                en: { type: String, required: true },
                ta: { type: String, required: true }
            },
            description: {
                en: { type: String, default: '' },
                ta: { type: String, default: '' }
            },
            acceptedFileTypes: [{ type: String, default: ['PDF', 'JPG', 'PNG'] }],
            maxFileSizeMB: { type: Number, default: 5 },
            ocrSupported: { type: Boolean, default: true }
        }
    ],
    applicationMethods: [
        {
            methodType: { type: String, required: true },
            title: {
                en: { type: String, required: true },
                ta: { type: String, required: true }
            },
            instructions: {
                en: { type: String, required: true },
                ta: { type: String, required: true }
            },
            responsibleOffice: {
                en: { type: String, default: 'Department Office' },
                ta: { type: String, default: 'துறை அலுவலகம்' }
            },
            officialWebsiteUrl: { type: String, default: '' }
        }
    ],
    applicationFrequency: { type: String, default: 'Monthly' },
    officialUrl: { type: String, default: 'https://tn.gov.in' },
    lastVerifiedDate: { type: String, default: '2026-01-01' },
    ruleVersion: { type: String, default: '1.0' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
exports.Scheme = mongoose_1.default.model('Scheme', SchemeSchema);
