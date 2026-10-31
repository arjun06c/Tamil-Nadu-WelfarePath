"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReportCSV = exports.getCompleteDashboardReport = exports.getRecentActivity = exports.getPendingAgingReport = exports.getOfficerPerformance = exports.getSchemePerformance = exports.getStatusDistribution = exports.getApplicationTrends = exports.getReportSummary = exports.buildJurisdictionQuery = exports.parseDateRange = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Application_1 = require("../models/Application");
const Scheme_1 = require("../models/Scheme");
const User_1 = require("../models/User");
/**
 * Robust date parser supporting predefined spans & custom boundaries.
 * Accurately determines current reporting window and previous equivalent baseline period.
 */
const parseDateRange = (rangeType, customStart, customEnd) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(now);
    let prevStartDate = new Date();
    let prevEndDate = new Date();
    let label = 'This Month';
    const type = rangeType || 'this_month';
    if (type === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        label = 'Today';
    }
    else if (type === 'last_7_days') {
        endDate = new Date(now);
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevEndDate = new Date(startDate.getTime() - 1);
        prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        label = 'Last 7 Days';
    }
    else if (type === 'last_month') {
        const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        startDate = firstDayPrevMonth;
        endDate = lastDayPrevMonth;
        const firstDayTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
        const lastDayTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
        prevStartDate = firstDayTwoMonthsAgo;
        prevEndDate = lastDayTwoMonthsAgo;
        label = 'Last Month';
    }
    else if (type === 'custom' && customStart && customEnd) {
        startDate = new Date(customStart + 'T00:00:00.000');
        endDate = new Date(customEnd + 'T23:59:59.999');
        const spanMs = endDate.getTime() - startDate.getTime();
        prevEndDate = new Date(startDate.getTime() - 1);
        prevStartDate = new Date(prevEndDate.getTime() - spanMs);
        label = `${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`;
    }
    else {
        // Default: 'this_month'
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now);
        // Equivalent duration in previous month
        const daysPassedInMonth = now.getDate();
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        prevEndDate = new Date(now.getFullYear(), now.getMonth() - 1, daysPassedInMonth, 23, 59, 59, 999);
        label = 'This Month';
    }
    return { startDate, endDate, prevStartDate, prevEndDate, label, rangeType: type };
};
exports.parseDateRange = parseDateRange;
/**
 * Builds district access filter respecting officer jurisdiction.
 * Prevents unauthorized cross-district data leakage.
 */
const buildJurisdictionQuery = (req, requestedDistrict) => {
    if (req.user?.role === User_1.UserRole.OFFICER) {
        const officerDistrict = req.user.district || 'Madurai';
        return {
            $or: [{ district: officerDistrict }, { assignedOfficerId: new mongoose_1.default.Types.ObjectId(req.user.id) }]
        };
    }
    // Admin users can inspect specific district or all districts
    if (requestedDistrict && requestedDistrict !== 'ALL') {
        return { district: requestedDistrict };
    }
    return {};
};
exports.buildJurisdictionQuery = buildJurisdictionQuery;
/**
 * Formats duration in hours into user-friendly government turnaround metrics
 */
const formatDuration = (hours) => {
    if (hours === null || isNaN(hours) || hours <= 0)
        return 'N/A';
    if (hours < 1) {
        const mins = Math.round(hours * 60);
        return `${mins} Mins`;
    }
    if (hours < 48) {
        return `${hours.toFixed(1)} Hours`;
    }
    const days = hours / 24;
    return `${days.toFixed(1)} Days`;
};
// ---------------------------------------------------------------------------
// 1. KPI SUMMARY REPORT
// ---------------------------------------------------------------------------
const getReportSummary = async (req, res) => {
    try {
        const { dateRange, startDate: customStart, endDate: customEnd, schemeId, status, district } = req.query;
        const dateFilter = (0, exports.parseDateRange)(dateRange, customStart, customEnd);
        const districtFilter = (0, exports.buildJurisdictionQuery)(req, district);
        const baseFilter = { ...districtFilter };
        if (schemeId && schemeId !== 'ALL' && mongoose_1.default.Types.ObjectId.isValid(schemeId)) {
            baseFilter.schemeId = new mongoose_1.default.Types.ObjectId(schemeId);
        }
        if (status && status !== 'ALL') {
            baseFilter.status = status;
        }
        // Current period filter on submittedAt
        const currentPeriodQuery = {
            ...baseFilter,
            submittedAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate }
        };
        // Previous equivalent period filter on submittedAt
        const prevPeriodQuery = {
            ...baseFilter,
            submittedAt: { $gte: dateFilter.prevStartDate, $lte: dateFilter.prevEndDate }
        };
        // Parallel counts
        const [currTotal, prevTotal, currPending, prevPending, currUnderReview, prevUnderReview, currApproved, prevApproved, currRejected, prevRejected, currCorrection, prevCorrection] = await Promise.all([
            Application_1.Application.countDocuments(currentPeriodQuery),
            Application_1.Application.countDocuments(prevPeriodQuery),
            Application_1.Application.countDocuments({
                ...currentPeriodQuery,
                status: { $in: [Application_1.ApplicationStatus.SUBMITTED, Application_1.ApplicationStatus.RESUBMITTED, Application_1.ApplicationStatus.DOC_VERIFICATION] }
            }),
            Application_1.Application.countDocuments({
                ...prevPeriodQuery,
                status: { $in: [Application_1.ApplicationStatus.SUBMITTED, Application_1.ApplicationStatus.RESUBMITTED, Application_1.ApplicationStatus.DOC_VERIFICATION] }
            }),
            Application_1.Application.countDocuments({
                ...currentPeriodQuery,
                status: { $in: [Application_1.ApplicationStatus.UNDER_REVIEW, Application_1.ApplicationStatus.OFFICER_REVIEW] }
            }),
            Application_1.Application.countDocuments({
                ...prevPeriodQuery,
                status: { $in: [Application_1.ApplicationStatus.UNDER_REVIEW, Application_1.ApplicationStatus.OFFICER_REVIEW] }
            }),
            Application_1.Application.countDocuments({
                ...currentPeriodQuery,
                status: { $in: [Application_1.ApplicationStatus.APPROVED, Application_1.ApplicationStatus.BENEFIT_RELEASED, Application_1.ApplicationStatus.COMPLETED] }
            }),
            Application_1.Application.countDocuments({
                ...prevPeriodQuery,
                status: { $in: [Application_1.ApplicationStatus.APPROVED, Application_1.ApplicationStatus.BENEFIT_RELEASED, Application_1.ApplicationStatus.COMPLETED] }
            }),
            Application_1.Application.countDocuments({
                ...currentPeriodQuery,
                status: Application_1.ApplicationStatus.REJECTED
            }),
            Application_1.Application.countDocuments({
                ...prevPeriodQuery,
                status: Application_1.ApplicationStatus.REJECTED
            }),
            Application_1.Application.countDocuments({
                ...currentPeriodQuery,
                status: Application_1.ApplicationStatus.CORRECTION_REQUIRED
            }),
            Application_1.Application.countDocuments({
                ...prevPeriodQuery,
                status: Application_1.ApplicationStatus.CORRECTION_REQUIRED
            })
        ]);
        const buildMetric = (current, previous) => ({
            count: current,
            previousCount: previous,
            delta: current - previous
        });
        res.status(200).json({
            period: {
                startDate: dateFilter.startDate,
                endDate: dateFilter.endDate,
                label: dateFilter.label,
                rangeType: dateFilter.rangeType
            },
            authorizedDistrict: req.user?.role === User_1.UserRole.OFFICER ? req.user.district : district || 'All Districts',
            kpis: {
                totalReceived: buildMetric(currTotal, prevTotal),
                pendingVerification: buildMetric(currPending, prevPending),
                underReview: buildMetric(currUnderReview, prevUnderReview),
                approved: buildMetric(currApproved, prevApproved),
                rejected: buildMetric(currRejected, prevRejected),
                correctionRequired: buildMetric(currCorrection, prevCorrection)
            },
            lastUpdated: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('getReportSummary error:', error);
        res.status(500).json({ message: 'Error calculating report KPI summary' });
    }
};
exports.getReportSummary = getReportSummary;
// ---------------------------------------------------------------------------
// 2. APPLICATION PROCESSING TRENDS (Received vs Processed)
// ---------------------------------------------------------------------------
const getApplicationTrends = async (req, res) => {
    try {
        const { dateRange, startDate: customStart, endDate: customEnd, schemeId, district, interval = 'weekly' } = req.query;
        const dateFilter = (0, exports.parseDateRange)(dateRange, customStart, customEnd);
        const districtFilter = (0, exports.buildJurisdictionQuery)(req, district);
        const baseFilter = { ...districtFilter };
        if (schemeId && schemeId !== 'ALL' && mongoose_1.default.Types.ObjectId.isValid(schemeId)) {
            baseFilter.schemeId = new mongoose_1.default.Types.ObjectId(schemeId);
        }
        // Retrieve applications submitted OR completed within the target window
        const applications = await Application_1.Application.find({
            ...baseFilter,
            $or: [
                { submittedAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate } },
                { approvedAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate } },
                { rejectedAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate } }
            ]
        }).select('submittedAt approvedAt rejectedAt status');
        // Aggregate trends based on chosen interval
        const trendMap = {};
        const getBucketKey = (date) => {
            const d = new Date(date);
            if (interval === 'monthly') {
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
                const periodStart = new Date(d.getFullYear(), d.getMonth(), 1);
                return { key: monthKey, label, periodStart };
            }
            if (interval === 'yearly') {
                const yearKey = `${d.getFullYear()}`;
                return { key: yearKey, label: yearKey, periodStart: new Date(d.getFullYear(), 0, 1) };
            }
            if (interval === 'daily') {
                const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const periodStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                return { key: dayKey, label, periodStart };
            }
            // Default: 'weekly'
            const startOfYear = new Date(d.getFullYear(), 0, 1);
            const pastDays = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
            const weekNumber = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
            const key = `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
            const label = `Week ${weekNumber}`;
            const periodStart = new Date(d.getTime() - (d.getDay() === 0 ? 6 : d.getDay() - 1) * 24 * 60 * 60 * 1000);
            return { key, label, periodStart };
        };
        // Ensure all time periods in range have an entry
        applications.forEach((app) => {
            if (app.submittedAt && app.submittedAt >= dateFilter.startDate && app.submittedAt <= dateFilter.endDate) {
                const { key, label, periodStart } = getBucketKey(app.submittedAt);
                if (!trendMap[key]) {
                    trendMap[key] = { label, periodStart, received: 0, processed: 0 };
                }
                trendMap[key].received += 1;
            }
            const decisionDate = app.approvedAt || app.rejectedAt;
            if (decisionDate && decisionDate >= dateFilter.startDate && decisionDate <= dateFilter.endDate) {
                const { key, label, periodStart } = getBucketKey(decisionDate);
                if (!trendMap[key]) {
                    trendMap[key] = { label, periodStart, received: 0, processed: 0 };
                }
                trendMap[key].processed += 1;
            }
        });
        // If map is empty (e.g. no apps in narrow range), generate empty placeholder interval point
        if (Object.keys(trendMap).length === 0) {
            const { key, label, periodStart } = getBucketKey(dateFilter.startDate);
            trendMap[key] = { label, periodStart, received: 0, processed: 0 };
        }
        const trends = Object.values(trendMap).sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
        res.status(200).json({ interval, trends });
    }
    catch (error) {
        console.error('getApplicationTrends error:', error);
        res.status(500).json({ message: 'Error calculating application trend breakdown' });
    }
};
exports.getApplicationTrends = getApplicationTrends;
// ---------------------------------------------------------------------------
// 3. APPLICATION STATUS DISTRIBUTION (Donut breakdown)
// ---------------------------------------------------------------------------
const getStatusDistribution = async (req, res) => {
    try {
        const { dateRange, startDate: customStart, endDate: customEnd, schemeId, district } = req.query;
        const dateFilter = (0, exports.parseDateRange)(dateRange, customStart, customEnd);
        const districtFilter = (0, exports.buildJurisdictionQuery)(req, district);
        const baseFilter = {
            ...districtFilter,
            submittedAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate }
        };
        if (schemeId && schemeId !== 'ALL' && mongoose_1.default.Types.ObjectId.isValid(schemeId)) {
            baseFilter.schemeId = new mongoose_1.default.Types.ObjectId(schemeId);
        }
        const totalInPeriod = await Application_1.Application.countDocuments(baseFilter);
        const statusCounts = await Application_1.Application.aggregate([
            { $match: baseFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const statusConfig = {
            [Application_1.ApplicationStatus.SUBMITTED]: { label: 'Submitted', color: '#3B82F6', order: 1 },
            [Application_1.ApplicationStatus.UNDER_REVIEW]: { label: 'Under Review', color: '#6366F1', order: 2 },
            [Application_1.ApplicationStatus.OFFICER_REVIEW]: { label: 'Officer Review', color: '#8B5CF6', order: 3 },
            [Application_1.ApplicationStatus.DOC_VERIFICATION]: { label: 'Doc Verification', color: '#0EA5E9', order: 4 },
            [Application_1.ApplicationStatus.CORRECTION_REQUIRED]: { label: 'Correction Required', color: '#F97316', order: 5 },
            [Application_1.ApplicationStatus.RESUBMITTED]: { label: 'Resubmitted', color: '#EAB308', order: 6 },
            [Application_1.ApplicationStatus.APPROVED]: { label: 'Approved', color: '#10B981', order: 7 },
            [Application_1.ApplicationStatus.BENEFIT_RELEASED]: { label: 'Benefit Released', color: '#059669', order: 8 },
            [Application_1.ApplicationStatus.COMPLETED]: { label: 'Completed', color: '#047857', order: 9 },
            [Application_1.ApplicationStatus.REJECTED]: { label: 'Rejected', color: '#EF4444', order: 10 }
        };
        const countMap = {};
        statusCounts.forEach((sc) => {
            countMap[sc._id] = sc.count;
        });
        // Group into 6 core government reporting cohorts
        const cohortData = [
            {
                status: 'SUBMITTED',
                label: 'Submitted',
                count: countMap[Application_1.ApplicationStatus.SUBMITTED] || 0,
                color: '#3B82F6'
            },
            {
                status: 'UNDER_REVIEW',
                label: 'Under Review',
                count: (countMap[Application_1.ApplicationStatus.UNDER_REVIEW] || 0) + (countMap[Application_1.ApplicationStatus.OFFICER_REVIEW] || 0),
                color: '#6366F1'
            },
            {
                status: 'CORRECTION_REQUIRED',
                label: 'Correction Required',
                count: countMap[Application_1.ApplicationStatus.CORRECTION_REQUIRED] || 0,
                color: '#F97316'
            },
            {
                status: 'RESUBMITTED',
                label: 'Resubmitted',
                count: countMap[Application_1.ApplicationStatus.RESUBMITTED] || 0,
                color: '#EAB308'
            },
            {
                status: 'APPROVED',
                label: 'Approved',
                count: (countMap[Application_1.ApplicationStatus.APPROVED] || 0) +
                    (countMap[Application_1.ApplicationStatus.BENEFIT_RELEASED] || 0) +
                    (countMap[Application_1.ApplicationStatus.COMPLETED] || 0),
                color: '#10B981'
            },
            {
                status: 'REJECTED',
                label: 'Rejected',
                count: countMap[Application_1.ApplicationStatus.REJECTED] || 0,
                color: '#EF4444'
            }
        ].map((item) => ({
            ...item,
            percentage: totalInPeriod > 0 ? Number(((item.count / totalInPeriod) * 100).toFixed(1)) : 0
        }));
        // Decision Breakdown for Section 4.D
        const approvedTotal = (countMap[Application_1.ApplicationStatus.APPROVED] || 0) +
            (countMap[Application_1.ApplicationStatus.BENEFIT_RELEASED] || 0) +
            (countMap[Application_1.ApplicationStatus.COMPLETED] || 0);
        const rejectedTotal = countMap[Application_1.ApplicationStatus.REJECTED] || 0;
        const awaitingDecision = totalInPeriod - (approvedTotal + rejectedTotal);
        const decisionAnalysis = {
            approved: {
                count: approvedTotal,
                percentage: totalInPeriod > 0 ? Number(((approvedTotal / totalInPeriod) * 100).toFixed(1)) : 0
            },
            rejected: {
                count: rejectedTotal,
                percentage: totalInPeriod > 0 ? Number(((rejectedTotal / totalInPeriod) * 100).toFixed(1)) : 0
            },
            awaitingDecision: {
                count: Math.max(0, awaitingDecision),
                percentage: totalInPeriod > 0 ? Number(((Math.max(0, awaitingDecision) / totalInPeriod) * 100).toFixed(1)) : 0
            }
        };
        res.status(200).json({
            total: totalInPeriod,
            distribution: cohortData,
            decisionAnalysis
        });
    }
    catch (error) {
        console.error('getStatusDistribution error:', error);
        res.status(500).json({ message: 'Error aggregating status distribution' });
    }
};
exports.getStatusDistribution = getStatusDistribution;
// ---------------------------------------------------------------------------
// 4. SCHEME PERFORMANCE REPORT
// ---------------------------------------------------------------------------
const getSchemePerformance = async (req, res) => {
    try {
        const { dateRange, startDate: customStart, endDate: customEnd, district } = req.query;
        const dateFilter = (0, exports.parseDateRange)(dateRange, customStart, customEnd);
        const districtFilter = (0, exports.buildJurisdictionQuery)(req, district);
        // Retrieve active welfare schemes
        const schemes = await Scheme_1.Scheme.find({ isActive: true }).select('schemeCode name department');
        const schemePerformanceList = await Promise.all(schemes.map(async (scheme) => {
            const schemeQuery = {
                ...districtFilter,
                schemeId: scheme._id,
                submittedAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate }
            };
            const applications = await Application_1.Application.find(schemeQuery).select('status submittedAt approvedAt rejectedAt verificationStartedAt statusHistory');
            const totalReceived = applications.length;
            let approved = 0;
            let rejected = 0;
            let pending = 0;
            let correctionRequired = 0;
            let totalProcessingHours = 0;
            let completedCount = 0;
            applications.forEach((app) => {
                if (app.status === Application_1.ApplicationStatus.APPROVED ||
                    app.status === Application_1.ApplicationStatus.BENEFIT_RELEASED ||
                    app.status === Application_1.ApplicationStatus.COMPLETED) {
                    approved += 1;
                    completedCount += 1;
                    const completionDate = app.approvedAt || app.updatedAt;
                    if (completionDate && app.submittedAt) {
                        const diffHours = (new Date(completionDate).getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60);
                        if (diffHours >= 0)
                            totalProcessingHours += diffHours;
                    }
                }
                else if (app.status === Application_1.ApplicationStatus.REJECTED) {
                    rejected += 1;
                    completedCount += 1;
                    const completionDate = app.rejectedAt || app.updatedAt;
                    if (completionDate && app.submittedAt) {
                        const diffHours = (new Date(completionDate).getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60);
                        if (diffHours >= 0)
                            totalProcessingHours += diffHours;
                    }
                }
                else if (app.status === Application_1.ApplicationStatus.CORRECTION_REQUIRED) {
                    correctionRequired += 1;
                    pending += 1;
                }
                else {
                    pending += 1;
                }
            });
            const decisions = approved + rejected;
            const approvalRate = decisions > 0 ? Number(((approved / decisions) * 100).toFixed(1)) : null;
            const avgProcessingTimeHours = completedCount > 0 ? Number((totalProcessingHours / completedCount).toFixed(1)) : null;
            return {
                schemeId: scheme._id,
                schemeCode: scheme.schemeCode,
                schemeName: scheme.name,
                department: scheme.department,
                totalReceived,
                approved,
                rejected,
                pending,
                correctionRequired,
                approvalRate,
                approvalRateDisplay: approvalRate !== null ? `${approvalRate}%` : 'N/A',
                avgProcessingTimeHours,
                avgProcessingTimeDisplay: formatDuration(avgProcessingTimeHours)
            };
        }));
        // Sort descending by total received
        schemePerformanceList.sort((a, b) => b.totalReceived - a.totalReceived);
        const activeSchemes = schemePerformanceList.filter((s) => s.totalReceived > 0 || s.pending > 0);
        const schemesToReturn = activeSchemes.length > 0 ? activeSchemes : schemePerformanceList.slice(0, 8);
        res.status(200).json({ schemes: schemesToReturn });
    }
    catch (error) {
        console.error('getSchemePerformance error:', error);
        res.status(500).json({ message: 'Error calculating welfare scheme performance' });
    }
};
exports.getSchemePerformance = getSchemePerformance;
// ---------------------------------------------------------------------------
// 5. OFFICER PERFORMANCE ANALYTICS
// ---------------------------------------------------------------------------
const getOfficerPerformance = async (req, res) => {
    try {
        const { dateRange, startDate: customStart, endDate: customEnd, schemeId, district } = req.query;
        const dateFilter = (0, exports.parseDateRange)(dateRange, customStart, customEnd);
        const districtFilter = (0, exports.buildJurisdictionQuery)(req, district);
        const baseFilter = { ...districtFilter };
        if (schemeId && schemeId !== 'ALL' && mongoose_1.default.Types.ObjectId.isValid(schemeId)) {
            baseFilter.schemeId = new mongoose_1.default.Types.ObjectId(schemeId);
        }
        // 1. Cohort of applications submitted during selected period
        const receivedInPeriod = await Application_1.Application.find({
            ...baseFilter,
            submittedAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate }
        }).select('status correctionCount submittedAt');
        const totalReceived = receivedInPeriod.length;
        // Applications in period requiring correction
        const correctionsCount = receivedInPeriod.filter((a) => a.status === Application_1.ApplicationStatus.CORRECTION_REQUIRED || (a.correctionCount && a.correctionCount > 0)).length;
        const correctionRate = totalReceived > 0 ? Number(((correctionsCount / totalReceived) * 100).toFixed(1)) : 0;
        // 2. Cohort of applications decided (approved or rejected) during selected period
        const decidedInPeriod = await Application_1.Application.find({
            ...baseFilter,
            $or: [
                { approvedAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate } },
                { rejectedAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate } }
            ]
        }).select('status submittedAt verificationStartedAt approvedAt rejectedAt updatedAt');
        let approvedInPeriod = 0;
        let rejectedInPeriod = 0;
        let totalProcessingTimeHours = 0;
        let validProcessingCases = 0;
        let totalVerificationTimeHours = 0;
        let validVerificationCases = 0;
        decidedInPeriod.forEach((app) => {
            const isApproved = app.status === Application_1.ApplicationStatus.APPROVED ||
                app.status === Application_1.ApplicationStatus.BENEFIT_RELEASED ||
                app.status === Application_1.ApplicationStatus.COMPLETED;
            const isRejected = app.status === Application_1.ApplicationStatus.REJECTED;
            if (isApproved)
                approvedInPeriod += 1;
            if (isRejected)
                rejectedInPeriod += 1;
            const completionDate = app.approvedAt || app.rejectedAt || app.updatedAt;
            // Processing Time: submittedAt -> decision
            if (completionDate && app.submittedAt) {
                const procHours = (new Date(completionDate).getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60);
                if (procHours >= 0) {
                    totalProcessingTimeHours += procHours;
                    validProcessingCases += 1;
                }
            }
            // Verification Time: verificationStartedAt -> decision
            if (completionDate && app.verificationStartedAt) {
                const verifHours = (new Date(completionDate).getTime() - new Date(app.verificationStartedAt).getTime()) / (1000 * 60 * 60);
                if (verifHours >= 0) {
                    totalVerificationTimeHours += verifHours;
                    validVerificationCases += 1;
                }
            }
        });
        const totalDecisions = approvedInPeriod + rejectedInPeriod;
        const approvalRate = totalDecisions > 0 ? Number(((approvedInPeriod / totalDecisions) * 100).toFixed(1)) : null;
        const avgProcessingTimeHours = validProcessingCases > 0 ? Number((totalProcessingTimeHours / validProcessingCases).toFixed(1)) : null;
        const avgVerificationTimeHours = validVerificationCases > 0 ? Number((totalVerificationTimeHours / validVerificationCases).toFixed(1)) : null;
        // Clearance Rate: Period-based clearance ratio
        const clearanceRate = totalReceived > 0 ? Number(((totalDecisions / totalReceived) * 100).toFixed(1)) : totalDecisions > 0 ? 100 : null;
        // 3. Pending Application Backlog (Currently pending in jurisdiction)
        const pendingStatuses = [
            Application_1.ApplicationStatus.SUBMITTED,
            Application_1.ApplicationStatus.RESUBMITTED,
            Application_1.ApplicationStatus.DOC_VERIFICATION,
            Application_1.ApplicationStatus.UNDER_REVIEW,
            Application_1.ApplicationStatus.OFFICER_REVIEW,
            Application_1.ApplicationStatus.CORRECTION_REQUIRED
        ];
        const allPendingApps = await Application_1.Application.find({
            ...baseFilter,
            status: { $in: pendingStatuses }
        }).select('submittedAt');
        const nowTime = Date.now();
        let pendingOver7Days = 0;
        let pendingOver15Days = 0;
        let pendingOver30Days = 0;
        allPendingApps.forEach((app) => {
            const ageDays = (nowTime - new Date(app.submittedAt).getTime()) / (24 * 60 * 60 * 1000);
            if (ageDays > 30) {
                pendingOver30Days += 1;
                pendingOver15Days += 1;
                pendingOver7Days += 1;
            }
            else if (ageDays > 15) {
                pendingOver15Days += 1;
                pendingOver7Days += 1;
            }
            else if (ageDays > 7) {
                pendingOver7Days += 1;
            }
        });
        res.status(200).json({
            periodLabel: dateFilter.label,
            avgVerificationTimeHours,
            avgVerificationTimeDisplay: formatDuration(avgVerificationTimeHours),
            avgProcessingTimeHours,
            avgProcessingTimeDisplay: formatDuration(avgProcessingTimeHours),
            approvalRate,
            approvalRateDisplay: approvalRate !== null ? `${approvalRate}%` : 'N/A',
            correctionRate,
            correctionRateDisplay: `${correctionRate}%`,
            clearanceRate,
            clearanceRateDisplay: clearanceRate !== null ? `${clearanceRate}%` : 'N/A',
            clearanceExplanation: `Period-based ratio: ${totalDecisions} cases decided vs ${totalReceived} applications received in ${dateFilter.label}.`,
            totalDecisionsInPeriod: totalDecisions,
            totalReceivedInPeriod: totalReceived,
            pendingBacklog: {
                totalPending: allPendingApps.length,
                pendingOver7Days,
                pendingOver15Days,
                pendingOver30Days
            }
        });
    }
    catch (error) {
        console.error('getOfficerPerformance error:', error);
        res.status(500).json({ message: 'Error calculating officer turnaround performance metrics' });
    }
};
exports.getOfficerPerformance = getOfficerPerformance;
// ---------------------------------------------------------------------------
// 6. PENDING APPLICATION AGING REPORT
// ---------------------------------------------------------------------------
const getPendingAgingReport = async (req, res) => {
    try {
        const { schemeId, district } = req.query;
        const districtFilter = (0, exports.buildJurisdictionQuery)(req, district);
        const baseFilter = {
            ...districtFilter,
            status: {
                $in: [
                    Application_1.ApplicationStatus.SUBMITTED,
                    Application_1.ApplicationStatus.RESUBMITTED,
                    Application_1.ApplicationStatus.DOC_VERIFICATION,
                    Application_1.ApplicationStatus.UNDER_REVIEW,
                    Application_1.ApplicationStatus.OFFICER_REVIEW,
                    Application_1.ApplicationStatus.CORRECTION_REQUIRED
                ]
            }
        };
        if (schemeId && schemeId !== 'ALL' && mongoose_1.default.Types.ObjectId.isValid(schemeId)) {
            baseFilter.schemeId = new mongoose_1.default.Types.ObjectId(schemeId);
        }
        const pendingApps = await Application_1.Application.find(baseFilter).select('submittedAt status');
        const nowTime = Date.now();
        const buckets = {
            '0_3_days': 0,
            '4_7_days': 0,
            '8_15_days': 0,
            '16_30_days': 0,
            over_30_days: 0
        };
        pendingApps.forEach((app) => {
            const ageDays = (nowTime - new Date(app.submittedAt).getTime()) / (24 * 60 * 60 * 1000);
            if (ageDays <= 3) {
                buckets['0_3_days'] += 1;
            }
            else if (ageDays <= 7) {
                buckets['4_7_days'] += 1;
            }
            else if (ageDays <= 15) {
                buckets['8_15_days'] += 1;
            }
            else if (ageDays <= 30) {
                buckets['16_30_days'] += 1;
            }
            else {
                buckets.over_30_days += 1;
            }
        });
        const agingBuckets = [
            {
                bucket: '0_3_days',
                label: '0–3 Days',
                count: buckets['0_3_days'],
                urgency: 'normal',
                color: '#10B981',
                description: 'Fresh cases within normal processing SLA'
            },
            {
                bucket: '4_7_days',
                label: '4–7 Days',
                count: buckets['4_7_days'],
                urgency: 'attention',
                color: '#3B82F6',
                description: 'Approaching recommended 7-day review threshold'
            },
            {
                bucket: '8_15_days',
                label: '8–15 Days',
                count: buckets['8_15_days'],
                urgency: 'warning',
                color: '#F59E0B',
                description: 'Priority case review required to prevent citizen delay'
            },
            {
                bucket: '16_30_days',
                label: '16–30 Days',
                count: buckets['16_30_days'],
                urgency: 'high',
                color: '#F97316',
                description: 'High aging backlog requiring immediate officer action'
            },
            {
                bucket: 'over_30_days',
                label: 'More than 30 Days',
                count: buckets.over_30_days,
                urgency: 'critical',
                color: '#EF4444',
                description: 'Critical statutory turnaround SLA breach'
            }
        ];
        res.status(200).json({
            totalPending: pendingApps.length,
            agingBuckets
        });
    }
    catch (error) {
        console.error('getPendingAgingReport error:', error);
        res.status(500).json({ message: 'Error calculating pending application aging' });
    }
};
exports.getPendingAgingReport = getPendingAgingReport;
// ---------------------------------------------------------------------------
// 7. RECENT APPLICATION ACTIVITY (Filterable & Paginated)
// ---------------------------------------------------------------------------
const getRecentActivity = async (req, res) => {
    try {
        const { dateRange, startDate: customStart, endDate: customEnd, schemeId, status, district, search, page = 1, limit = 10, sortBy = 'updatedAt', sortDir = 'desc' } = req.query;
        const dateFilter = (0, exports.parseDateRange)(dateRange, customStart, customEnd);
        const districtFilter = (0, exports.buildJurisdictionQuery)(req, district);
        const query = {
            ...districtFilter
        };
        // Filter by submission within window if dateRange specified
        if (dateRange && dateRange !== 'all') {
            query.submittedAt = { $gte: dateFilter.startDate, $lte: dateFilter.endDate };
        }
        if (schemeId && schemeId !== 'ALL' && mongoose_1.default.Types.ObjectId.isValid(schemeId)) {
            query.schemeId = new mongoose_1.default.Types.ObjectId(schemeId);
        }
        if (status && status !== 'ALL') {
            query.status = status;
        }
        if (search && String(search).trim()) {
            const searchRegex = new RegExp(String(search).trim(), 'i');
            query.$or = [
                { applicationNo: searchRegex },
                { applicationReference: searchRegex },
                { 'formData.applicantName': searchRegex }
            ];
        }
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;
        const sortField = sortBy || 'updatedAt';
        const sortDirection = sortDir === 'asc' ? 1 : -1;
        const [totalCount, rawApplications] = await Promise.all([
            Application_1.Application.countDocuments(query),
            Application_1.Application.find(query)
                .populate('citizenId', 'name email mobile district')
                .populate('schemeId', 'name schemeCode department')
                .populate('assignedOfficerId', 'name email district')
                .sort({ [sortField]: sortDirection })
                .skip(skip)
                .limit(limitNum)
        ]);
        const applications = rawApplications.map((app) => {
            const citizenName = app.citizenId?.name || app.formData?.applicantName || 'Citizen Applicant';
            const schemeName = app.schemeId?.name || { en: 'Government Welfare Scheme', ta: 'அரசு நலத்திட்டம்' };
            const assignedOfficer = app.assignedOfficerId?.name || 'Unassigned / District Pool';
            return {
                id: app._id,
                applicationNo: app.applicationNo,
                applicationReference: app.applicationReference,
                citizenName,
                citizenDistrict: app.district,
                schemeId: app.schemeId?._id,
                schemeCode: app.schemeId?.schemeCode,
                schemeName,
                status: app.status,
                submittedAt: app.submittedAt,
                updatedAt: app.updatedAt,
                assignedOfficer,
                correctionCount: app.correctionCount || 0,
                officerRemarks: app.officerRemarks || ''
            };
        });
        res.status(200).json({
            applications,
            pagination: {
                totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalCount / limitNum) || 1
            }
        });
    }
    catch (error) {
        console.error('getRecentActivity error:', error);
        res.status(500).json({ message: 'Error retrieving recent application activity' });
    }
};
exports.getRecentActivity = getRecentActivity;
// ---------------------------------------------------------------------------
// 8. CONSOLIDATED COMPLETE DASHBOARD REPORT (Single-Flight Load)
// ---------------------------------------------------------------------------
const getCompleteDashboardReport = async (req, res) => {
    try {
        const { dateRange, startDate: customStart, endDate: customEnd, schemeId, status, district } = req.query;
        // Execute core aggregations concurrently
        const [summaryRes, trendsRes, statusRes, schemeRes, officerRes, agingRes] = await Promise.all([
            new Promise((resolve) => {
                const mockRes = { status: () => ({ json: (d) => resolve(d) }) };
                (0, exports.getReportSummary)(req, mockRes);
            }),
            new Promise((resolve) => {
                const mockRes = { status: () => ({ json: (d) => resolve(d) }) };
                (0, exports.getApplicationTrends)(req, mockRes);
            }),
            new Promise((resolve) => {
                const mockRes = { status: () => ({ json: (d) => resolve(d) }) };
                (0, exports.getStatusDistribution)(req, mockRes);
            }),
            new Promise((resolve) => {
                const mockRes = { status: () => ({ json: (d) => resolve(d) }) };
                (0, exports.getSchemePerformance)(req, mockRes);
            }),
            new Promise((resolve) => {
                const mockRes = { status: () => ({ json: (d) => resolve(d) }) };
                (0, exports.getOfficerPerformance)(req, mockRes);
            }),
            new Promise((resolve) => {
                const mockRes = { status: () => ({ json: (d) => resolve(d) }) };
                (0, exports.getPendingAgingReport)(req, mockRes);
            })
        ]);
        res.status(200).json({
            summary: summaryRes,
            trends: trendsRes,
            statusDistribution: statusRes,
            schemePerformance: schemeRes,
            officerPerformance: officerRes,
            pendingAging: agingRes
        });
    }
    catch (error) {
        console.error('getCompleteDashboardReport error:', error);
        res.status(500).json({ message: 'Error aggregating complete officer report dashboard' });
    }
};
exports.getCompleteDashboardReport = getCompleteDashboardReport;
// ---------------------------------------------------------------------------
// 9. EXPORT REPORT CSV
// ---------------------------------------------------------------------------
const exportReportCSV = async (req, res) => {
    try {
        const { dateRange, startDate: customStart, endDate: customEnd, schemeId, status, district } = req.query;
        const dateFilter = (0, exports.parseDateRange)(dateRange, customStart, customEnd);
        const districtFilter = (0, exports.buildJurisdictionQuery)(req, district);
        const query = { ...districtFilter };
        if (dateRange && dateRange !== 'all') {
            query.submittedAt = { $gte: dateFilter.startDate, $lte: dateFilter.endDate };
        }
        if (schemeId && schemeId !== 'ALL' && mongoose_1.default.Types.ObjectId.isValid(schemeId)) {
            query.schemeId = new mongoose_1.default.Types.ObjectId(schemeId);
        }
        if (status && status !== 'ALL') {
            query.status = status;
        }
        const applications = await Application_1.Application.find(query)
            .populate('citizenId', 'name email mobile district')
            .populate('schemeId', 'name schemeCode department')
            .populate('assignedOfficerId', 'name email')
            .sort({ updatedAt: -1 });
        const authDistrict = req.user?.role === User_1.UserRole.OFFICER ? req.user.district : district || 'All Districts';
        let csv = `GOVERNMENT OF TAMIL NADU - DISTRICT WELFARE OFFICER APPLICATION REVIEW REPORT\r\n`;
        csv += `Authorized District,${authDistrict}\r\n`;
        csv += `Reporting Period,${dateFilter.label} (${dateFilter.startDate.toISOString().slice(0, 10)} to ${dateFilter.endDate.toISOString().slice(0, 10)})\r\n`;
        csv += `Generated At,${new Date().toISOString()}\r\n`;
        csv += `Generated By,${req.user?.name || 'Authorized Officer'} (${req.user?.email || 'officer@tnwelfare.gov.in'})\r\n`;
        csv += `Total Applications Exported,${applications.length}\r\n\r\n`;
        csv += `APPLICATION DETAIL LOG\r\n`;
        csv += `Application Reference,Citizen Name,District,Scheme Code,Scheme Name,Status,Submission Date,Last Updated,Assigned Officer,Correction Count,Officer Remarks\r\n`;
        const sanitize = (val) => {
            if (val === undefined || val === null)
                return '""';
            const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
            return `"${str}"`;
        };
        applications.forEach((app) => {
            const cName = app.citizenId?.name || app.formData?.applicantName || 'Citizen Applicant';
            const sName = app.schemeId?.name?.en || 'Welfare Scheme';
            const sCode = app.schemeId?.schemeCode || 'N/A';
            const offName = app.assignedOfficerId?.name || 'Unassigned';
            const sub = app.submittedAt ? new Date(app.submittedAt).toISOString().slice(0, 10) : 'N/A';
            const upd = app.updatedAt ? new Date(app.updatedAt).toISOString().slice(0, 10) : 'N/A';
            csv +=
                [
                    sanitize(app.applicationReference || app.applicationNo),
                    sanitize(cName),
                    sanitize(app.district),
                    sanitize(sCode),
                    sanitize(sName),
                    sanitize(app.status),
                    sanitize(sub),
                    sanitize(upd),
                    sanitize(offName),
                    app.correctionCount || 0,
                    sanitize(app.officerRemarks || '')
                ].join(',') + '\r\n';
        });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="TN_Welfare_Review_Report_${Date.now()}.csv"`);
        res.status(200).send('\uFEFF' + csv);
    }
    catch (error) {
        console.error('exportReportCSV error:', error);
        res.status(500).json({ message: 'Error generating report export CSV' });
    }
};
exports.exportReportCSV = exportReportCSV;
