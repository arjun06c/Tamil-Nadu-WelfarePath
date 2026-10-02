import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedScheme extends Document {
  citizenId: mongoose.Types.ObjectId;
  schemeId: mongoose.Types.ObjectId;
  savedAt: Date;
}

const SavedSchemeSchema: Schema = new Schema(
  {
    citizenId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schemeId: { type: Schema.Types.ObjectId, ref: 'Scheme', required: true },
    savedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

SavedSchemeSchema.index({ citizenId: 1, schemeId: 1 }, { unique: true });

export const SavedScheme = mongoose.model<ISavedScheme>('SavedScheme', SavedSchemeSchema);
