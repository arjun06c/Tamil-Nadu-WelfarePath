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
exports.evaluateAllSchemesHandler = exports.evaluateSchemeEligibilityHandler = exports.testRulesHandler = exports.updateSchemeAdmin = exports.createSchemeAdmin = exports.updateDomainAdmin = exports.createDomainAdmin = exports.getRecommendedSchemes = exports.getSchemeById = exports.getAllSchemes = exports.getDomainByKey = exports.getAllDomains = void 0;
const Scheme_1 = require("../models/Scheme");
const WelfareDomain_1 = require("../models/WelfareDomain");
const CitizenProfile_1 = require("../models/CitizenProfile");
const EligibilityEvaluation_1 = require("../models/EligibilityEvaluation");
const ApplicationDocument_1 = require("../models/ApplicationDocument");
const eligibilityService_1 = require("../services/eligibilityService");
const getAllDomains = async (req, res) => {
    try {
        const domains = await WelfareDomain_1.WelfareDomain.find().sort({ displayOrder: 1 });
        const counts = await Scheme_1.Scheme.aggregate([
            { $match: { isActive: true, status: { $ne: 'ARCHIVED' } } },
            { $group: { _id: '$domainKey', count: { $sum: 1 } } }
        ]);
        const countMap = {};
        counts.forEach((c) => {
            countMap[c._id] = c.count;
        });
        const domainsWithCounts = domains.map((d) => ({
            ...d.toObject(),
            schemeCount: countMap[d.domainKey] || 0
        }));
        const totalDomains = domains.length;
        const totalSchemes = await Scheme_1.Scheme.countDocuments({ status: { $ne: 'ARCHIVED' } });
        const publishedSchemes = await Scheme_1.Scheme.countDocuments({ status: 'PUBLISHED', isActive: true });
        const draftSchemes = await Scheme_1.Scheme.countDocuments({ status: 'DRAFT' });
        res.status(200).json({
            domains: domainsWithCounts,
            stats: {
                totalDomains,
                totalSchemes,
                publishedSchemes,
                draftSchemes
            }
        });
    }
    catch (error) {
        console.error('getAllDomains error:', error);
        res.status(500).json({ message: 'Error fetching welfare domains' });
    }
};
exports.getAllDomains = getAllDomains;
const getDomainByKey = async (req, res) => {
    try {
        const { domainKey } = req.params;
        const domain = await WelfareDomain_1.WelfareDomain.findOne({ domainKey });
        if (!domain) {
            res.status(404).json({ message: 'Domain not found' });
            return;
        }
        const schemes = await Scheme_1.Scheme.find({ domainKey, isActive: true, status: 'PUBLISHED' }).sort({ createdAt: -1 });
        res.status(200).json({ domain, schemes, count: schemes.length });
    }
    catch (error) {
        console.error('getDomainByKey error:', error);
        res.status(500).json({ message: 'Error fetching domain details' });
    }
};
exports.getDomainByKey = getDomainByKey;
const getAllSchemes = async (req, res) => {
    try {
        const { search, domainKey, status, department, includeDrafts } = req.query;
        const query = {};
        if (includeDrafts === 'true' || status) {
            if (status) {
                query.status = status;
            }
            else {
                query.status = { $ne: 'ARCHIVED' };
            }
        }
        else {
            query.isActive = true;
            query.status = 'PUBLISHED';
        }
        if (domainKey) {
            query.domainKey = domainKey;
        }
        if (department) {
            query.$or = [
                { 'department.en': new RegExp(String(department), 'i') },
                { 'department.ta': new RegExp(String(department), 'i') }
            ];
        }
        if (search) {
            const searchRegex = new RegExp(String(search), 'i');
            query.$or = [
                { 'name.en': searchRegex },
                { 'name.ta': searchRegex },
                { 'department.en': searchRegex },
                { 'department.ta': searchRegex },
                { 'description.en': searchRegex },
                { 'description.ta': searchRegex },
                { schemeCode: searchRegex }
            ];
        }
        const schemes = await Scheme_1.Scheme.find(query).sort({ createdAt: -1 });
        res.status(200).json({ schemes, count: schemes.length });
    }
    catch (error) {
        console.error('getAllSchemes error:', error);
        res.status(500).json({ message: 'Error fetching schemes' });
    }
};
exports.getAllSchemes = getAllSchemes;
const getSchemeById = async (req, res) => {
    try {
        const { id } = req.params;
        let scheme = await Scheme_1.Scheme.findById(id);
        if (!scheme) {
            scheme = await Scheme_1.Scheme.findOne({ schemeCode: id });
        }
        if (!scheme) {
            res.status(404).json({ message: 'Scheme not found' });
            return;
        }
        res.status(200).json({ scheme });
    }
    catch (error) {
        console.error('getSchemeById error:', error);
        res.status(500).json({ message: 'Error fetching scheme detail' });
    }
};
exports.getSchemeById = getSchemeById;
const getRecommendedSchemes = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const { getEvaluatedRecommendationsForCitizen } = await Promise.resolve().then(() => __importStar(require('./citizenDashboardController')));
        const { summary, recommendations } = await getEvaluatedRecommendationsForCitizen(req.user.id);
        res.status(200).json({
            summary,
            recommendations
        });
    }
    catch (error) {
        console.error('getRecommendedSchemes error:', error);
        res.status(500).json({ message: 'Error fetching recommended schemes' });
    }
};
exports.getRecommendedSchemes = getRecommendedSchemes;
const createDomainAdmin = async (req, res) => {
    try {
        const { domainKey, name, description, iconName, displayOrder, status } = req.body;
        if (!domainKey || !name?.en || !name?.ta) {
            res.status(400).json({ message: 'Domain key and bilingual names are required' });
            return;
        }
        const domain = await WelfareDomain_1.WelfareDomain.create({
            domainKey,
            name,
            description: description || { en: '', ta: '' },
            iconName: iconName || 'Award',
            displayOrder: displayOrder || 0,
            status: status || 'ACTIVE'
        });
        res.status(201).json({ domain });
    }
    catch (error) {
        console.error('createDomainAdmin error:', error);
        res.status(500).json({ message: error.message || 'Error creating domain' });
    }
};
exports.createDomainAdmin = createDomainAdmin;
const updateDomainAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const domain = await WelfareDomain_1.WelfareDomain.findByIdAndUpdate(id, req.body, { new: true });
        if (!domain) {
            res.status(404).json({ message: 'Domain not found' });
            return;
        }
        res.status(200).json({ domain });
    }
    catch (error) {
        console.error('updateDomainAdmin error:', error);
        res.status(500).json({ message: error.message || 'Error updating domain' });
    }
};
exports.updateDomainAdmin = updateDomainAdmin;
const createSchemeAdmin = async (req, res) => {
    try {
        const { schemeCode, name, department, domainKey, description, benefitSummary, rules, requiredDocuments, status, isDemoData } = req.body;
        if (!schemeCode || !name?.en || !domainKey || !department?.en) {
            res.status(400).json({ message: 'Scheme code, name, department, and domain key are required' });
            return;
        }
        const scheme = await Scheme_1.Scheme.create({
            schemeCode,
            name,
            department,
            domainKey,
            description: description || { en: '', ta: '' },
            benefitSummary: benefitSummary || { en: '', ta: '' },
            rules: rules || { all: [] },
            requiredDocuments: requiredDocuments || [],
            status: status || 'DRAFT',
            isActive: status === 'PUBLISHED',
            isDemoData: !!isDemoData
        });
        res.status(201).json({ scheme });
    }
    catch (error) {
        console.error('createSchemeAdmin error:', error);
        res.status(500).json({ message: error.message || 'Error creating scheme' });
    }
};
exports.createSchemeAdmin = createSchemeAdmin;
const updateSchemeAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        if (updates.status) {
            updates.isActive = updates.status === 'PUBLISHED';
        }
        // Increment ruleVersion if rules are updated
        if (updates.rules) {
            const existing = await Scheme_1.Scheme.findById(id);
            if (existing) {
                const vNum = parseFloat(existing.ruleVersion || '1.0');
                updates.ruleVersion = (vNum + 0.1).toFixed(1);
            }
        }
        const scheme = await Scheme_1.Scheme.findByIdAndUpdate(id, updates, { new: true });
        if (!scheme) {
            res.status(404).json({ message: 'Scheme not found' });
            return;
        }
        res.status(200).json({ scheme });
    }
    catch (error) {
        console.error('updateSchemeAdmin error:', error);
        res.status(500).json({ message: error.message || 'Error updating scheme' });
    }
};
exports.updateSchemeAdmin = updateSchemeAdmin;
const testRulesHandler = async (req, res) => {
    try {
        const { rules, requiredDocuments, sampleProfile } = req.body;
        if (!rules || !sampleProfile) {
            res.status(400).json({ message: 'Rules and sample profile are required for testing' });
            return;
        }
        const mockScheme = {
            rules: rules || { all: [] },
            requiredDocuments: requiredDocuments || []
        };
        const outcome = (0, eligibilityService_1.evaluateSchemeEligibility)(mockScheme, sampleProfile, sampleProfile.attachedDocTypes || []);
        res.status(200).json({
            outcome
        });
    }
    catch (error) {
        console.error('testRulesHandler error:', error);
        res.status(500).json({ message: error.message || 'Error testing rules' });
    }
};
exports.testRulesHandler = testRulesHandler;
const evaluateSchemeEligibilityHandler = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const { id: schemeId } = req.params;
        const scheme = await Scheme_1.Scheme.findById(schemeId);
        if (!scheme) {
            res.status(404).json({ message: 'Scheme not found' });
            return;
        }
        let profile = await CitizenProfile_1.CitizenProfile.findOne({ userId: req.user.id });
        if (!profile) {
            res.status(400).json({ message: 'Citizen profile incomplete. Please build your profile first.' });
            return;
        }
        // Gather application document facts
        const appDocs = await ApplicationDocument_1.ApplicationDocument.find({ citizenId: req.user.id });
        const attachedDocTypes = appDocs.map((d) => d.docType);
        const confirmedFacts = {};
        const verifiedFacts = {};
        for (const doc of appDocs) {
            const facts = doc.citizenConfirmedData || doc.extractedData || {};
            if (doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED') {
                Object.assign(verifiedFacts, facts);
            }
            else {
                Object.assign(confirmedFacts, facts);
            }
        }
        const outcome = (0, eligibilityService_1.evaluateSchemeEligibility)(scheme, profile, attachedDocTypes, {
            confirmedFacts,
            verifiedFacts,
            attachedDocTypes
        });
        // Save/cache evaluation result
        const evaluation = await EligibilityEvaluation_1.EligibilityEvaluation.findOneAndUpdate({ citizenId: req.user.id, schemeId: scheme._id }, {
            citizenId: req.user.id,
            schemeId: scheme._id,
            status: outcome.status,
            criteriaBreakdown: outcome.criteriaBreakdown,
            missingDocuments: outcome.missingDocuments,
            failedMandatoryCount: outcome.failedMandatoryCount,
            gapAnalysisRemarks: outcome.gapAnalysisRemarks,
            evaluatedAt: new Date()
        }, { upsert: true, new: true });
        res.status(200).json({
            scheme,
            evaluation,
            outcome
        });
    }
    catch (error) {
        console.error('evaluateSchemeEligibility error:', error);
        res.status(500).json({ message: 'Error evaluating scheme eligibility' });
    }
};
exports.evaluateSchemeEligibilityHandler = evaluateSchemeEligibilityHandler;
const evaluateAllSchemesHandler = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        let profile = await CitizenProfile_1.CitizenProfile.findOne({ userId: req.user.id });
        if (!profile) {
            res.status(400).json({ message: 'Citizen profile incomplete. Please build your profile first.' });
            return;
        }
        const appDocs = await ApplicationDocument_1.ApplicationDocument.find({ citizenId: req.user.id });
        const attachedDocTypes = appDocs.map((d) => d.docType);
        const confirmedFacts = {};
        const verifiedFacts = {};
        for (const doc of appDocs) {
            const facts = doc.citizenConfirmedData || doc.extractedData || {};
            if (doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED') {
                Object.assign(verifiedFacts, facts);
            }
            else {
                Object.assign(confirmedFacts, facts);
            }
        }
        const schemes = await Scheme_1.Scheme.find({ isActive: true });
        const eligibleSchemes = [];
        const nearEligibleSchemes = [];
        const notEligibleSchemes = [];
        const allConflicts = [];
        for (const scheme of schemes) {
            const outcome = (0, eligibilityService_1.evaluateSchemeEligibility)(scheme, profile, attachedDocTypes, {
                confirmedFacts,
                verifiedFacts,
                attachedDocTypes
            });
            if (outcome.conflictDetails && outcome.conflictDetails.length > 0) {
                allConflicts.push(...outcome.conflictDetails);
            }
            const item = {
                scheme,
                status: outcome.status,
                isPreliminaryMatch: outcome.isPreliminaryMatch,
                isVerifiedMatch: outcome.isVerifiedMatch,
                hasDataConflict: outcome.hasDataConflict,
                conflictDetails: outcome.conflictDetails,
                criteriaBreakdown: outcome.criteriaBreakdown,
                gapAnalysisRemarks: outcome.gapAnalysisRemarks,
                failedMandatoryCount: outcome.failedMandatoryCount,
                missingDocumentsCount: outcome.missingDocuments.length
            };
            if (outcome.status === 'ELIGIBLE') {
                eligibleSchemes.push(item);
            }
            else if (outcome.status === 'NEAR_ELIGIBLE') {
                nearEligibleSchemes.push(item);
            }
            else {
                notEligibleSchemes.push(item);
            }
        }
        res.status(200).json({
            totalEvaluated: schemes.length,
            eligibleCount: eligibleSchemes.length,
            nearEligibleCount: nearEligibleSchemes.length,
            notEligibleCount: notEligibleSchemes.length,
            allConflicts,
            eligibleSchemes,
            nearEligibleSchemes,
            notEligibleSchemes
        });
    }
    catch (error) {
        console.error('evaluateAllSchemes error:', error);
        res.status(500).json({ message: 'Error evaluating dashboard schemes' });
    }
};
exports.evaluateAllSchemesHandler = evaluateAllSchemesHandler;
