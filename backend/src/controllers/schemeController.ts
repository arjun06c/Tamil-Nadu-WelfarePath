import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Scheme } from '../models/Scheme';
import { WelfareDomain } from '../models/WelfareDomain';
import { CitizenProfile } from '../models/CitizenProfile';
import { EligibilityEvaluation } from '../models/EligibilityEvaluation';
import { ApplicationDocument } from '../models/ApplicationDocument';
import { DigiLockerDocument } from '../models/DigiLockerDocument';
import { evaluateSchemeEligibility, IDocumentFactContext } from '../services/eligibilityService';

export const getAllDomains = async (req: Request, res: Response): Promise<void> => {
  try {
    const domains = await WelfareDomain.find().sort({ displayOrder: 1 });

    const counts = await Scheme.aggregate([
      { $match: { isActive: true, status: { $ne: 'ARCHIVED' } } },
      { $group: { _id: '$domainKey', count: { $sum: 1 } } }
    ]);

    const countMap: Record<string, number> = {};
    counts.forEach((c) => {
      countMap[c._id] = c.count;
    });

    const domainsWithCounts = domains.map((d) => ({
      ...d.toObject(),
      schemeCount: countMap[d.domainKey] || 0
    }));

    const totalDomains = domains.length;
    const totalSchemes = await Scheme.countDocuments({ status: { $ne: 'ARCHIVED' } });
    const publishedSchemes = await Scheme.countDocuments({ status: 'PUBLISHED', isActive: true });
    const draftSchemes = await Scheme.countDocuments({ status: 'DRAFT' });

    res.status(200).json({
      domains: domainsWithCounts,
      stats: {
        totalDomains,
        totalSchemes,
        publishedSchemes,
        draftSchemes
      }
    });
  } catch (error) {
    console.error('getAllDomains error:', error);
    res.status(500).json({ message: 'Error fetching welfare domains' });
  }
};

export const getDomainByKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { domainKey } = req.params;
    const domain = await WelfareDomain.findOne({ domainKey });
    if (!domain) {
      res.status(404).json({ message: 'Domain not found' });
      return;
    }

    const schemes = await Scheme.find({ domainKey, isActive: true, status: 'PUBLISHED' }).sort({ createdAt: -1 });

    res.status(200).json({ domain, schemes, count: schemes.length });
  } catch (error) {
    console.error('getDomainByKey error:', error);
    res.status(500).json({ message: 'Error fetching domain details' });
  }
};

export const getAllSchemes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, domainKey, status, department, includeDrafts } = req.query;

    const query: any = {};

    if (includeDrafts === 'true' || status) {
      if (status) {
        query.status = status;
      } else {
        query.status = { $ne: 'ARCHIVED' };
      }
    } else {
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

    const schemes = await Scheme.find(query).sort({ createdAt: -1 });
    res.status(200).json({ schemes, count: schemes.length });
  } catch (error) {
    console.error('getAllSchemes error:', error);
    res.status(500).json({ message: 'Error fetching schemes' });
  }
};

export const getSchemeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let scheme = await Scheme.findById(id);
    if (!scheme) {
      scheme = await Scheme.findOne({ schemeCode: id });
    }
    if (!scheme) {
      res.status(404).json({ message: 'Scheme not found' });
      return;
    }
    res.status(200).json({ scheme });
  } catch (error) {
    console.error('getSchemeById error:', error);
    res.status(500).json({ message: 'Error fetching scheme detail' });
  }
};

export const getRecommendedSchemes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const { getEvaluatedRecommendationsForCitizen } = await import('./citizenDashboardController');
    const { summary, recommendations } = await getEvaluatedRecommendationsForCitizen(req.user.id);

    res.status(200).json({
      summary,
      recommendations
    });
  } catch (error) {
    console.error('getRecommendedSchemes error:', error);
    res.status(500).json({ message: 'Error fetching recommended schemes' });
  }
};

export const createDomainAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { domainKey, name, description, iconName, displayOrder, status } = req.body;
    if (!domainKey || !name?.en || !name?.ta) {
      res.status(400).json({ message: 'Domain key and bilingual names are required' });
      return;
    }

    const domain = await WelfareDomain.create({
      domainKey,
      name,
      description: description || { en: '', ta: '' },
      iconName: iconName || 'Award',
      displayOrder: displayOrder || 0,
      status: status || 'ACTIVE'
    });

    res.status(201).json({ domain });
  } catch (error: any) {
    console.error('createDomainAdmin error:', error);
    res.status(500).json({ message: error.message || 'Error creating domain' });
  }
};

export const updateDomainAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const domain = await WelfareDomain.findByIdAndUpdate(id, req.body, { new: true });
    if (!domain) {
      res.status(404).json({ message: 'Domain not found' });
      return;
    }
    res.status(200).json({ domain });
  } catch (error: any) {
    console.error('updateDomainAdmin error:', error);
    res.status(500).json({ message: error.message || 'Error updating domain' });
  }
};

export const createSchemeAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { schemeCode, name, department, domainKey, description, benefitSummary, rules, requiredDocuments, status, isDemoData } = req.body;
    if (!schemeCode || !name?.en || !domainKey || !department?.en) {
      res.status(400).json({ message: 'Scheme code, name, department, and domain key are required' });
      return;
    }

    const scheme = await Scheme.create({
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
  } catch (error: any) {
    console.error('createSchemeAdmin error:', error);
    res.status(500).json({ message: error.message || 'Error creating scheme' });
  }
};

export const updateSchemeAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.status) {
      updates.isActive = updates.status === 'PUBLISHED';
    }

    // Increment ruleVersion if rules are updated
    if (updates.rules) {
      const existing = await Scheme.findById(id);
      if (existing) {
        const vNum = parseFloat(existing.ruleVersion || '1.0');
        updates.ruleVersion = (vNum + 0.1).toFixed(1);
      }
    }

    const scheme = await Scheme.findByIdAndUpdate(id, updates, { new: true });
    if (!scheme) {
      res.status(404).json({ message: 'Scheme not found' });
      return;
    }
    res.status(200).json({ scheme });
  } catch (error: any) {
    console.error('updateSchemeAdmin error:', error);
    res.status(500).json({ message: error.message || 'Error updating scheme' });
  }
};

export const testRulesHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rules, requiredDocuments, sampleProfile } = req.body;
    if (!rules || !sampleProfile) {
      res.status(400).json({ message: 'Rules and sample profile are required for testing' });
      return;
    }

    const mockScheme = {
      rules: rules || { all: [] },
      requiredDocuments: requiredDocuments || []
    } as any;

    const outcome = evaluateSchemeEligibility(mockScheme, sampleProfile, sampleProfile.attachedDocTypes || []);

    res.status(200).json({
      outcome
    });
  } catch (error: any) {
    console.error('testRulesHandler error:', error);
    res.status(500).json({ message: error.message || 'Error testing rules' });
  }
};

export const evaluateSchemeEligibilityHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const { id: schemeId } = req.params;
    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      res.status(404).json({ message: 'Scheme not found' });
      return;
    }

    let profile = await CitizenProfile.findOne({ userId: req.user.id });
    if (!profile) {
      res.status(400).json({ message: 'Citizen profile incomplete. Please build your profile first.' });
      return;
    }

    // Gather application document facts
    const appDocs = await ApplicationDocument.find({ citizenId: req.user.id });
    const attachedDocTypes = appDocs.map((d) => d.docType);
    const confirmedFacts: Record<string, any> = {};
    const verifiedFacts: Record<string, any> = {};

    for (const doc of appDocs) {
      const facts = doc.citizenConfirmedData || doc.extractedData || {};
      if (doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED') {
        Object.assign(verifiedFacts, facts);
      } else {
        Object.assign(confirmedFacts, facts);
      }
    }

    const outcome = evaluateSchemeEligibility(scheme, profile, attachedDocTypes, {
      confirmedFacts,
      verifiedFacts,
      attachedDocTypes
    });

    // Save/cache evaluation result
    const evaluation = await EligibilityEvaluation.findOneAndUpdate(
      { citizenId: req.user.id, schemeId: scheme._id },
      {
        citizenId: req.user.id,
        schemeId: scheme._id,
        status: outcome.status,
        criteriaBreakdown: outcome.criteriaBreakdown,
        missingDocuments: outcome.missingDocuments,
        failedMandatoryCount: outcome.failedMandatoryCount,
        gapAnalysisRemarks: outcome.gapAnalysisRemarks,
        evaluatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      scheme,
      evaluation,
      outcome
    });
  } catch (error) {
    console.error('evaluateSchemeEligibility error:', error);
    res.status(500).json({ message: 'Error evaluating scheme eligibility' });
  }
};

export const evaluateAllSchemesHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    let profile = await CitizenProfile.findOne({ userId: req.user.id });
    if (!profile) {
      res.status(400).json({ message: 'Citizen profile incomplete. Please build your profile first.' });
      return;
    }

    const appDocs = await ApplicationDocument.find({ citizenId: req.user.id });
    const attachedDocTypes = appDocs.map((d) => d.docType);
    const confirmedFacts: Record<string, any> = {};
    const verifiedFacts: Record<string, any> = {};

    for (const doc of appDocs) {
      const facts = doc.citizenConfirmedData || doc.extractedData || {};
      if (doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED') {
        Object.assign(verifiedFacts, facts);
      } else {
        Object.assign(confirmedFacts, facts);
      }
    }

    const schemes = await Scheme.find({ isActive: true });

    const eligibleSchemes: any[] = [];
    const nearEligibleSchemes: any[] = [];
    const notEligibleSchemes: any[] = [];
    const allConflicts: any[] = [];

    for (const scheme of schemes) {
      const outcome = evaluateSchemeEligibility(scheme, profile, attachedDocTypes, {
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
      } else if (outcome.status === 'NEAR_ELIGIBLE') {
        nearEligibleSchemes.push(item);
      } else {
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
  } catch (error) {
    console.error('evaluateAllSchemes error:', error);
    res.status(500).json({ message: 'Error evaluating dashboard schemes' });
  }
};

