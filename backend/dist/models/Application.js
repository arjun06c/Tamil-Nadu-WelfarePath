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
exports.Application = exports.ApplicationStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["DRAFT"] = "DRAFT";
    ApplicationStatus["SUBMITTED"] = "SUBMITTED";
    ApplicationStatus["DOC_VERIFICATION"] = "DOC_VERIFICATION";
    ApplicationStatus["CORRECTION_REQUIRED"] = "CORRECTION_REQUIRED";
    ApplicationStatus["OFFICER_REVIEW"] = "OFFICER_REVIEW";
    ApplicationStatus["APPROVED"] = "APPROVED";
    ApplicationStatus["REJECTED"] = "REJECTED";
    ApplicationStatus["BENEFIT_RELEASED"] = "BENEFIT_RELEASED";
    ApplicationStatus["COMPLETED"] = "COMPLETED";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
const ApplicationSchema = new mongoose_1.Schema({
    applicationNo: { type: String, required: true },
    applicationReference: { type: String, required: true, unique: true },
    citizenId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    schemeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Scheme', required: true },
    applicationMethod: { type: String, default: 'PROTOTYPE_ASSISTED' },
    status: {
        type: String,
        enum: Object.values(ApplicationStatus),
        default: ApplicationStatus.SUBMITTED
    },
    currentStep: { type: Number, default: 1 },
    completionPercentage: { type: Number, default: 0 },
    formData: { type: Object, default: {} },
    statusHistory: [
        {
            previousStatus: { type: String, default: 'DRAFT' },
            newStatus: { type: String, required: true },
            changedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            changedByRole: { type: String, default: 'Citizen' },
            reason: { type: String, default: '' },
            remarks: { type: String, default: '' },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    officerRemarks: { type: String, default: '' },
    correctionCount: { type: Number, default: 0 },
    assignedOfficerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    declarationAccepted: { type: Boolean, default: true },
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });
exports.Application = mongoose_1.default.model('Application', ApplicationSchema);
