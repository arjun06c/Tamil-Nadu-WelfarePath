"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const CitizenProfile_1 = require("../models/CitizenProfile");
const User_1 = require("../models/User");
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        let profile = await CitizenProfile_1.CitizenProfile.findOne({ userId: req.user.id });
        if (!profile) {
            const user = await User_1.User.findById(req.user.id);
            profile = await CitizenProfile_1.CitizenProfile.create({
                userId: req.user.id,
                dob: new Date('2000-01-01'),
                gender: 'Female',
                district: user?.district || 'Chennai',
                taluk: '',
                villageTown: '',
                annualIncome: 150000,
                occupation: '',
                employmentStatus: 'Student',
                educationLevel: 'Undergraduate',
                socialCategory: 'BC',
                disabilityStatus: false,
                disabilityPercentage: 0,
                isFarmer: false,
                isUnorganizedWorker: false,
                govtSchoolYears6To12: false,
                familyMembersCount: 4,
                dependentsCount: 2
            });
        }
        res.status(200).json({ profile });
    }
    catch (error) {
        console.error('getProfile error:', error);
        res.status(500).json({ message: 'Error fetching citizen profile' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const profileData = req.body;
        const profile = await CitizenProfile_1.CitizenProfile.findOneAndUpdate({ userId: req.user.id }, { $set: profileData }, { new: true, upsert: true, runValidators: true });
        res.status(200).json({
            message: 'Profile updated successfully',
            profile
        });
    }
    catch (error) {
        console.error('updateProfile error:', error);
        res.status(500).json({ message: 'Error updating citizen profile' });
    }
};
exports.updateProfile = updateProfile;
