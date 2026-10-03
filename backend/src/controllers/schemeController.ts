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
    res.status(200).json({ domains });
  } catch (error) {
    console.error('getAllDomains error:', error);
    res.status(500).json({ message: 'Error fetching welfare domains' });
  }
};

export const getAllSchemes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, domainKey, category } = req.query;

    const query: any = { isActive: true };

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

    const schemes = await Scheme.find(query).sort({ createdAt: -1 });
    res.status(200).json({ schemes });
  } catch (error) {
    console.error('getAllSchemes error:', error);
    res.status(500).json({ message: 'Error fetching schemes' });
  }
};

export const getSchemeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const scheme = await Scheme.findById(id);
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

