import mongoose, { Schema, Document } from 'mongoose';

export interface IWelfareDomain extends Document {
  domainKey: string;
  name: {
    en: string;
    ta: string;
  };
  description: {
    en: string;
    ta: string;
  };
  iconName: string;
  displayOrder: number;
}

const WelfareDomainSchema: Schema = new Schema(
  {
    domainKey: { type: String, required: true, unique: true },
    name: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    description: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    iconName: { type: String, default: 'Award' },
    displayOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const WelfareDomain = mongoose.model<IWelfareDomain>('WelfareDomain', WelfareDomainSchema);
