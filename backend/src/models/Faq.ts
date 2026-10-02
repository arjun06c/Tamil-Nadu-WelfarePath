import mongoose, { Schema, Document } from 'mongoose';

export interface IFaq extends Document {
  question: {
    en: string;
    ta: string;
  };
  answer: {
    en: string;
    ta: string;
  };
  category: string;
  displayOrder: number;
  isActive: boolean;
}

const FaqSchema: Schema = new Schema(
  {
    question: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    answer: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    category: { type: String, default: 'General' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Faq = mongoose.model<IFaq>('Faq', FaqSchema);
