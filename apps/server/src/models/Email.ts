import mongoose from "mongoose";

const TriageResultSchema = new mongoose.Schema(
  {
    category:   { type: String, enum: ["urgent","needs_reply","fyi","spam"] },
    priority:   { type: Number, min: 1, max: 5 },
    summary:    { type: String },
    needsReply: { type: Boolean },
  },
  { _id: false }
);

const EmailSchema = new mongoose.Schema(
  {
    userId:       { type: String, required: true, index: true },
    gmailId:      { type: String, required: true, unique: true },
    threadId:     { type: String, required: true },
    subject:      { type: String, default: "(no subject)" },
    from:         { type: String, required: true },
    date:         { type: String, required: true },
    snippet:      { type: String, default: "" },
    body:         { type: String, default: "" },
    isRead:       { type: Boolean, default: false },
    isReplied:    { type: Boolean, default: false },
    triageResult: { type: TriageResultSchema, default: undefined },
  },
  { timestamps: true }
);

EmailSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Email ??
  mongoose.model("Email", EmailSchema);