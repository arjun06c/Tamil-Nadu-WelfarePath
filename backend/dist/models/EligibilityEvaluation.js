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
exports.EligibilityEvaluation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const EligibilityEvaluationSchema = new mongoose_1.Schema({
    citizenId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    schemeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Scheme', required: true },
    status: {
        type: String,
        enum: ['ELIGIBLE', 'NEAR_ELIGIBLE', 'NOT_ELIGIBLE'],
        required: true
    },
    criteriaBreakdown: [
        {
            field: { type: String, required: true },
            operator: { type: String, required: true },
            requiredValue: { type: mongoose_1.Schema.Types.Mixed },
            citizenValue: { type: mongoose_1.Schema.Types.Mixed },
            passed: { type: Boolean, required: true },
            label: {
                en: { type: String, required: true },
                ta: { type: String, required: true }
            },
            explanation: {
                en: { type: String, required: true },
                ta: { type: String, required: true }
            },
            isMandatory: { type: Boolean, default: true }
        }
    ],
    missingDocuments: [
        {
            docType: { type: String, required: true },
            label: {
                en: { type: String, required: true },
                ta: { type: String, required: true }
            },
            isMandatory: { type: Boolean, default: true }
        }
    ],
    failedMandatoryCount: { type: Number, default: 0 },
    gapAnalysisRemarks: {
        en: { type: String, default: '' },
        ta: { type: String, default: '' }
    },
    evaluatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
exports.EligibilityEvaluation = mongoose_1.default.model('EligibilityEvaluation', EligibilityEvaluationSchema);
