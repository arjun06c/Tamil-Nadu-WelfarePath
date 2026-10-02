"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateAllSchemesHandler = exports.evaluateSchemeEligibilityHandler = exports.getSchemeById = exports.getAllSchemes = exports.getAllDomains = void 0;
const Scheme_1 = require("../models/Scheme");
const WelfareDomain_1 = require("../models/WelfareDomain");
const CitizenProfile_1 = require("../models/CitizenProfile");
const EligibilityEvaluation_1 = require("../models/EligibilityEvaluation");
const eligibilityService_1 = require("../services/eligibilityService");
const getAllDomains = async (req, res) => {
    try {
        const domains = await WelfareDomain_1.WelfareDomain.find().sort({ displayOrder: 1 });
        res.status(200).json({ domains });
    }
    catch (error) {
        console.error('getAllDomains error:', error);
        res.status(500).json({ message: 'Error fetching welfare domains' });
    }
};
exports.getAllDomains = getAllDomains;
const getAllSchemes = async (req, res) => {
    try {
        const { search, domainKey, category } = req.query;
        const query = { isActive: true };
        if (domainKey) {
            query.domainKey = domainKey;
        }
        if (search) {
            const searchRegex = new RegExp(String(search), 'i');
            query.$or = [
                { 'name.en': searchRegex },
                { 'name.ta': searchRegex },
                { 'department.en': searchRegex },
                { 'department.ta': searchRegex },
                { schemeCode: searchRegex }
            ];
        }
        const schemes = await Scheme_1.Scheme.find(query).sort({ createdAt: -1 });
        res.status(200).json({ schemes });
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
        const scheme = await Scheme_1.Scheme.findById(id);
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
        const outcome = (0, eligibilityService_1.evaluateSchemeEligibility)(scheme, profile, []);
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
        const schemes = await Scheme_1.Scheme.find({ isActive: true });
        const eligibleSchemes = [];
        const nearEligibleSchemes = [];
        const notEligibleSchemes = [];
        for (const scheme of schemes) {
            const outcome = (0, eligibilityService_1.evaluateSchemeEligibility)(scheme, profile, []);
            const item = {
                scheme,
                status: outcome.status,
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
