import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: {
    en: string;
    ta: string;
  };
  message: {
    en: string;
    ta: string;
  };
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED';
  linkUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    message: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    type: {
      type: String,
      enum: ['INFO', 'SUCCESS', 'WARNING', 'ACTION_REQUIRED'],
      default: 'INFO'
    },
    linkUrl: { type: String, default: '' },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
