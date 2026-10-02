"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationRead = exports.getNotifications = exports.toggleSaveScheme = exports.getSavedSchemes = exports.getFaqs = void 0;
const Faq_1 = require("../models/Faq");
const SavedScheme_1 = require("../models/SavedScheme");
const Notification_1 = require("../models/Notification");
const mongoose_1 = __importDefault(require("mongoose"));
const getFaqs = async (req, res) => {
    try {
        const faqs = await Faq_1.Faq.find({ isActive: true }).sort({ displayOrder: 1 });
        res.status(200).json({ faqs });
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching FAQs' });
    }
};
exports.getFaqs = getFaqs;
const getSavedSchemes = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const saved = await SavedScheme_1.SavedScheme.find({ citizenId: req.user.id }).populate('schemeId');
        res.status(200).json({ savedSchemes: saved.map((s) => s.schemeId) });
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching saved schemes' });
    }
};
exports.getSavedSchemes = getSavedSchemes;
const toggleSaveScheme = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const schemeId = req.params.schemeId;
        const existing = await SavedScheme_1.SavedScheme.findOne({
            citizenId: req.user.id,
            schemeId: new mongoose_1.default.Types.ObjectId(schemeId)
        });
        if (existing) {
            await SavedScheme_1.SavedScheme.deleteOne({ _id: existing._id });
            res.status(200).json({ message: 'Scheme removed from saved bookmarks', isSaved: false });
        }
        else {
            await SavedScheme_1.SavedScheme.create({ citizenId: req.user.id, schemeId });
            res.status(200).json({ message: 'Scheme saved successfully', isSaved: true });
        }
    }
    catch (err) {
        res.status(500).json({ message: 'Error toggling saved scheme' });
    }
};
exports.toggleSaveScheme = toggleSaveScheme;
const getNotifications = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const notifications = await Notification_1.Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ notifications });
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching notifications' });
    }
};
exports.getNotifications = getNotifications;
const markNotificationRead = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const { id } = req.params;
        await Notification_1.Notification.findByIdAndUpdate(id, { isRead: true });
        res.status(200).json({ message: 'Notification marked as read' });
    }
    catch (err) {
        res.status(500).json({ message: 'Error updating notification status' });
    }
};
exports.markNotificationRead = markNotificationRead;
