import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Application, ApplicationStatus } from '../models/Application';
import { Scheme } from '../models/Scheme';
import { User, UserRole } from '../models/User';
import { DuplicateFlag, DuplicateReviewStatus } from '../models/DuplicateFlag';
import { BenefitRecord } from '../models/BenefitRecord';
import { AuditLog } from '../models/AuditLog';

export const getAllApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [{ applicationNo: searchRegex }];
    }

    const applications = await Application.find(query)
      .populate('schemeId')
      .populate('citizenId', 'name email mobile district')
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    console.error('getAllApplications error:', error);
    res.status(500).json({ message: 'Error fetching application queue' });
  }
};

export const updateApplicationStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const { id } = req.params;
    const { status, remarks, correctionRequested } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const previousStatus = application.status;
    application.status = status;
    application.officerRemarks = remarks || application.officerRemarks;

    if (status === ApplicationStatus.CORRECTION_REQUIRED) {
      application.correctionCount = (application.correctionCount || 0) + 1;
    }

    application.statusHistory.push({
      previousStatus: previousStatus as string,
      newStatus: status as string,
      changedBy: req.user.id as any,
      changedByRole: req.user.role || 'Officer',
      remarks: remarks || `Status updated to ${status} by Officer`,
      timestamp: new Date()
    });

    await application.save();

    // If Approved, create active BenefitRecord
    if (status === ApplicationStatus.APPROVED) {
      const scheme = await Scheme.findById(application.schemeId);
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      await BenefitRecord.create({
        applicationId: application._id,
        citizenId: application.citizenId,
        schemeId: application.schemeId,
        disbursementAmount: 1000,
        disbursementFrequency: 'Monthly',
        releaseDate: new Date(),
        status: 'ACTIVE',
        nextRenewalDate: nextYear,
        benefitReferenceNo: `TN-BEN-${Math.floor(100000 + Math.random() * 900000)}`,
        notes: `Benefit approved under ${scheme?.name?.en || 'Welfare Scheme'}`
      });
    }

    // Audit log
    await AuditLog.create({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: `UPDATE_APPLICATION_STATUS_${status}`,
      targetType: 'Application',
      targetId: application._id.toString(),
      details: remarks || `Application status changed to ${status}`
    });

    res.status(200).json({
      message: `Application status updated to ${status}`,
      application
    });
  } catch (error) {
    console.error('updateApplicationStatus error:', error);
    res.status(500).json({ message: 'Error updating application status' });
  }
};

export const getDuplicateFlags = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const flags = await DuplicateFlag.find()
      .populate({
        path: 'applicationId',
        populate: [{ path: 'schemeId' }, { path: 'citizenId', select: 'name email district' }]
      })
      .populate({
        path: 'matchedApplicationId',
        populate: [{ path: 'schemeId' }, { path: 'citizenId', select: 'name email district' }]
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ flags });
  } catch (error) {
    console.error('getDuplicateFlags error:', error);
    res.status(500).json({ message: 'Error fetching duplicate integrity flags' });
  }
};

export const updateDuplicateFlagStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const { id } = req.params;
    const { reviewStatus, officerNotes } = req.body;

    const flag = await DuplicateFlag.findByIdAndUpdate(
      id,
      {
        reviewStatus,
        officerNotes,
        reviewedBy: req.user.id
      },
      { new: true }
    );

    res.status(200).json({
      message: 'Duplicate flag review updated',
      flag
    });
  } catch (error) {
    console.error('updateDuplicateFlagStatus error:', error);
    res.status(500).json({ message: 'Error updating duplicate flag status' });
  }
};

export const getDashboardAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalCitizens = await User.countDocuments({ role: UserRole.CITIZEN });
    const totalSchemes = await Scheme.countDocuments({ isActive: true });
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({
      status: { $in: [ApplicationStatus.SUBMITTED, ApplicationStatus.DOC_VERIFICATION, ApplicationStatus.OFFICER_REVIEW] }
    });
    const approvedApplications = await Application.countDocuments({ status: ApplicationStatus.APPROVED });
    const rejectedApplications = await Application.countDocuments({ status: ApplicationStatus.REJECTED });
    const duplicateFlagsCount = await DuplicateFlag.countDocuments({ reviewStatus: DuplicateReviewStatus.PENDING });
    const activeBenefitsCount = await BenefitRecord.countDocuments({ status: 'ACTIVE' });

    // Applications by Status
    const statusBreakdown = [
      { name: 'Submitted', count: await Application.countDocuments({ status: ApplicationStatus.SUBMITTED }) },
      { name: 'Doc Verification', count: await Application.countDocuments({ status: ApplicationStatus.DOC_VERIFICATION }) },
      { name: 'Officer Review', count: await Application.countDocuments({ status: ApplicationStatus.OFFICER_REVIEW }) },
      { name: 'Correction Required', count: await Application.countDocuments({ status: ApplicationStatus.CORRECTION_REQUIRED }) },
      { name: 'Approved', count: approvedApplications },
      { name: 'Rejected', count: rejectedApplications }
    ];

    res.status(200).json({
      metrics: {
        totalCitizens,
        totalSchemes,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        duplicateFlagsCount,
        activeBenefitsCount
      },
      statusBreakdown
    });
  } catch (error) {
    console.error('getDashboardAnalytics error:', error);
    res.status(500).json({ message: 'Error generating analytics metrics' });
  }
};
