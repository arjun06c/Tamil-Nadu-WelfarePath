"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkApplicationIntegrity = exports.calculateStringSimilarity = void 0;
const Application_1 = require("../models/Application");
const CitizenProfile_1 = require("../models/CitizenProfile");
const User_1 = require("../models/User");
const DuplicateFlag_1 = require("../models/DuplicateFlag");
// String similarity metric (Levenshtein / Dice Coefficient)
const calculateStringSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2)
        return 1.0;
    if (!s1 || !s2)
        return 0.0;
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = [];
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        }
    }
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return Number((1 - distance / maxLen).toFixed(2));
};
exports.calculateStringSimilarity = calculateStringSimilarity;
const checkApplicationIntegrity = async (currentApp) => {
    try {
        const citizenProfile = await CitizenProfile_1.CitizenProfile.findOne({ userId: currentApp.citizenId });
        const citizenUser = await User_1.User.findById(currentApp.citizenId);
        if (!citizenProfile || !citizenUser)
            return;
        // Find all other applications for the same scheme
        const otherApps = await Application_1.Application.find({
            _id: { $ne: currentApp._id },
            schemeId: currentApp.schemeId
        });
        for (const otherApp of otherApps) {
            const otherProfile = await CitizenProfile_1.CitizenProfile.findOne({ userId: otherApp.citizenId });
            const otherUser = await User_1.User.findById(otherApp.citizenId);
            if (!otherProfile || !otherUser)
                continue;
            // Check 1: Same Aadhaar Hash
            if (citizenProfile.aadhaarHash &&
                otherProfile.aadhaarHash &&
                citizenProfile.aadhaarHash === otherProfile.aadhaarHash) {
                await DuplicateFlag_1.DuplicateFlag.create({
                    applicationId: currentApp._id,
                    matchedApplicationId: otherApp._id,
                    flagType: DuplicateFlag_1.DuplicateFlagType.SAME_AADHAAR,
                    similarityScore: 1.0,
                    matchingDetails: `Exact match on Aadhaar Hash between Application ${currentApp.applicationNo} and ${otherApp.applicationNo}`,
                    reviewStatus: DuplicateFlag_1.DuplicateReviewStatus.PENDING
                });
            }
            // Check 2: Same Bank Account Hash
            if (citizenProfile.bankDetails?.accountNoHash &&
                otherProfile.bankDetails?.accountNoHash &&
                citizenProfile.bankDetails.accountNoHash === otherProfile.bankDetails.accountNoHash) {
                await DuplicateFlag_1.DuplicateFlag.create({
                    applicationId: currentApp._id,
                    matchedApplicationId: otherApp._id,
                    flagType: DuplicateFlag_1.DuplicateFlagType.SAME_BANK,
                    similarityScore: 1.0,
                    matchingDetails: `Exact match on Bank Account Hash between Application ${currentApp.applicationNo} and ${otherApp.applicationNo}`,
                    reviewStatus: DuplicateFlag_1.DuplicateReviewStatus.PENDING
                });
            }
            // Check 3: High Name + DOB + District Similarity
            const nameSim = (0, exports.calculateStringSimilarity)(citizenUser.name, otherUser.name);
            const dobMatch = new Date(citizenProfile.dob).toDateString() === new Date(otherProfile.dob).toDateString();
            const districtMatch = citizenProfile.district === otherProfile.district;
            if (nameSim >= 0.85 && dobMatch && districtMatch) {
                await DuplicateFlag_1.DuplicateFlag.create({
                    applicationId: currentApp._id,
                    matchedApplicationId: otherApp._id,
                    flagType: DuplicateFlag_1.DuplicateFlagType.HIGH_NAME_DOB_SIMILARITY,
                    similarityScore: nameSim,
                    matchingDetails: `High demographic similarity (${(nameSim * 100).toFixed(0)}%) with identical Date of Birth and District.`,
                    reviewStatus: DuplicateFlag_1.DuplicateReviewStatus.PENDING
                });
            }
        }
    }
    catch (err) {
        console.error('[Duplicate Check Error]:', err);
    }
};
exports.checkApplicationIntegrity = checkApplicationIntegrity;
