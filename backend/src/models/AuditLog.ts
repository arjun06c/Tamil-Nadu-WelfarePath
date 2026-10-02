import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorEmail: { type: String, default: 'System' },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, default: '' },
    details: { type: String, default: '' },
    ipAddress: { type: String, default: '' }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
