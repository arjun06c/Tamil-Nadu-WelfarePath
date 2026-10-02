import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Faq } from '../models/Faq';
import { SavedScheme } from '../models/SavedScheme';
import { Notification } from '../models/Notification';
import mongoose from 'mongoose';

export const getFaqs = async (req: Request, res: Response): Promise<void> => {
  try {
    const faqs = await Faq.find({ isActive: true }).sort({ displayOrder: 1 });
    res.status(200).json({ faqs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching FAQs' });
  }
};

export const getSavedSchemes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }
    const saved = await SavedScheme.find({ citizenId: req.user.id }).populate('schemeId');
    res.status(200).json({ savedSchemes: saved.map((s) => s.schemeId) });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching saved schemes' });
  }
};

export const toggleSaveScheme = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }
    const schemeId = req.params.schemeId as string;

    const existing = await SavedScheme.findOne({
      citizenId: req.user.id,
      schemeId: new mongoose.Types.ObjectId(schemeId)
    });
    
    if (existing) {
      await SavedScheme.deleteOne({ _id: existing._id });
      res.status(200).json({ message: 'Scheme removed from saved bookmarks', isSaved: false });
    } else {
      await SavedScheme.create({ citizenId: req.user.id, schemeId });
      res.status(200).json({ message: 'Scheme saved successfully', isSaved: true });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error toggling saved scheme' });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification status' });
  }
};
