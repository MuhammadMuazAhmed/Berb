import mongoose, { Schema, Types, type Model, type InferSchemaType } from "mongoose";
import { STATUSES } from "@/lib/scheduling/status";

const opts = { timestamps: true } as const;
const m = <T>(name: string, schema: Schema): Model<T> => (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);

// ---------- Service ----------
const serviceSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: "", maxlength: 1000 },
  category: { type: String, required: true, index: true },
  defaultDurationMinutes: { type: Number, required: true, min: 15, max: 720 },
  bufferMinutes: { type: Number, default: 0, min: 0, max: 240 },
  startingPrice: { type: Number, min: 0 },
  active: { type: Boolean, default: true, index: true },
}, opts);
export const Service = m<InferSchemaType<typeof serviceSchema>>("Service", serviceSchema);

// ---------- TeamMember ----------
const hmSub = new Schema({ start: String, end: String }, { _id: false });
const teamSchema = new Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  profileImage: String, biography: String,
  serviceIds: [{ type: Schema.Types.ObjectId, ref: "Service" }],
  active: { type: Boolean, default: true, index: true },
  timeZone: { type: String, default: "Asia/Karachi" },
  workingSchedule: [new Schema({ day: { type: Number, min: 0, max: 6 }, intervals: [hmSub], breaks: [hmSub] }, { _id: false })],
  // Time off / manual blocks. Availability is ALWAYS derived (schedule - time off - jobs); there is no isAvailable flag.
  unavailablePeriods: [new Schema({ start: { type: Date, required: true }, end: { type: Date, required: true }, reason: String }, { _id: true })],
}, opts);
teamSchema.index({ serviceIds: 1, active: 1 });
export const TeamMember = m<InferSchemaType<typeof teamSchema>>("TeamMember", teamSchema);

// ---------- ServiceRequest ----------
const historySub = new Schema({
  action: { type: String, enum: ["assigned", "rescheduled", "cancelled", "rejected", "status_changed"], required: true },
  teamMemberId: Schema.Types.ObjectId, start: Date, end: Date, status: String, note: String,
  by: { type: Schema.Types.ObjectId, ref: "AdminUser" }, at: { type: Date, default: Date.now },
}, { _id: false });
const requestSchema = new Schema({
  reference: { type: String, required: true, unique: true },
  customerName: { type: String, required: true }, customerEmail: { type: String, required: true, lowercase: true }, customerPhone: String,
  serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  source: { type: String, enum: ["service_page", "offer_form"], required: true },
  requestType: { type: String, enum: ["service_request", "quote_request"], required: true },
  urgency: { type: String, enum: ["emergency", "urgent", "standard"] },
  address: {
    line1: { type: String, required: true }, city: { type: String, default: "" }, postalCode: String, country: { type: String, default: "DE" },
    coordinates: { lat: Number, lng: Number },
  },
  requestedStart: Date, requestedEnd: Date,
  preferredTeamMemberId: { type: Schema.Types.ObjectId, ref: "TeamMember" }, // internal only
  assignedTeamMemberId: { type: Schema.Types.ObjectId, ref: "TeamMember" },
  durationMinutes: { type: Number, required: true }, bufferMinutes: { type: Number, default: 0 }, // snapshot at creation/assignment
  scheduledStart: Date, scheduledEnd: Date,
  /** scheduledEnd + buffer: the end of the blocked window. Only meaningful while status is assigned/in_progress. */
  blockedEnd: Date,
  description: { type: String, required: true }, additionalInfo: String,
  status: { type: String, enum: STATUSES, default: "pending", required: true },
  adminNotes: String, rejectionReason: String, cancellationReason: String,
  assignmentHistory: [historySub],
  dedupeHash: { type: String, index: true },
}, opts);
requestSchema.index({ status: 1, createdAt: -1 });
requestSchema.index({ serviceId: 1, createdAt: -1 });
requestSchema.index({ requestedStart: 1 });
// Serves the availability overlap query (member + blocking status + time window)
requestSchema.index({ assignedTeamMemberId: 1, status: 1, scheduledStart: 1, blockedEnd: 1 });
requestSchema.index({ scheduledStart: 1, status: 1 });
export const ServiceRequest = m<InferSchemaType<typeof requestSchema>>("ServiceRequest", requestSchema);

// ---------- AdminUser ----------
const adminSchema = new Schema({
  name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["owner", "admin", "viewer"], default: "admin" },
  active: { type: Boolean, default: true },
}, opts);
export const AdminUser = m<InferSchemaType<typeof adminSchema>>("AdminUser", adminSchema);

// A unique singleton document permanently closes public initial-owner setup.
const adminInitializationSchema = new Schema({
  _id: { type: String, required: true, enum: ["initial-owner"] },
  ownerId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
  completedAt: { type: Date, required: true },
}, { versionKey: false });
export const AdminInitialization = m<{ _id: string; ownerId: Types.ObjectId; completedAt: Date }>("AdminInitialization", adminInitializationSchema);

// ---------- Notification (transactional outbox) ----------
const notificationSchema = new Schema({
  serviceRequestId: { type: Schema.Types.ObjectId, ref: "ServiceRequest", required: true, index: true },
  teamMemberId: { type: Schema.Types.ObjectId, ref: "TeamMember" },
  recipient: { type: String, required: true },
  notificationType: { type: String, enum: ["job_assigned", "job_rescheduled", "job_cancelled"], required: true },
  status: { type: String, enum: ["pending", "processing", "sent", "failed"], default: "pending" },
  /** one record per intended delivery => retries/duplicate calls can't create duplicates */
  dedupeKey: { type: String, required: true, unique: true },
  payload: { type: Schema.Types.Mixed },
  providerMessageId: String, attemptCount: { type: Number, default: 0 }, lastError: String,
  nextAttemptAt: { type: Date, default: Date.now }, lockedUntil: Date, sentAt: Date,
}, opts);
notificationSchema.index({ status: 1, nextAttemptAt: 1 });
export const Notification = m<InferSchemaType<typeof notificationSchema>>("Notification", notificationSchema);

// ---------- ScheduleLock (distributed per-member mutex) ----------
const lockSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true }, // = teamMemberId; uniqueness of _id IS the mutex
  owner: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 120 } }, // cleanup of abandoned locks
}, { versionKey: false });
export const ScheduleLock = m<{ _id: Types.ObjectId; owner: string; expiresAt: Date }>("ScheduleLock", lockSchema);

// ---------- RateLimit (Mongo-backed so it works across instances) ----------
const rateSchema = new Schema({
  key: { type: String, required: true, unique: true }, count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
}, { versionKey: false });
export const RateLimit = m<{ key: string; count: number; expiresAt: Date }>("RateLimit", rateSchema);
