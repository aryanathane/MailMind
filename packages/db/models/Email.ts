import mongoose, { Document, Model, Schema } from "mongoose";
import type { IEmail } from "@mailmind/types";

export interface IEmailDocument extends IEmail, Document {}

const TriageResultSchema = new Schema(
  {
    // Must match EmailCategory type exactly — Claude returns these strings
    category: {
      type: String,
      enum: ["urgent", "needs_reply", "fyi", "spam"],
      required: true,
    },
    // 1 = most important, 5 = least important
    priority: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    summary: {
      type: String,
      required: true, // one sentence Claude writes about the email
    },
    needsReply: {
      type: Boolean,
      required: true, // tells us whether to generate a draft
    },
  },
  { _id: false } // no separate _id for this nested object
);

const EmailSchema = new Schema<IEmailDocument>(
  {
    // Links this email to a user — always query emails by userId
    userId: {
      type: String,
      required: true,
      index: true, // indexed for fast lookup: "give me all emails for user X"
    },

    // Gmail identifiers — needed to fetch body or send reply via Gmail API
    gmailId: {
      type: String,
      required: true,
      unique: true, // prevent storing the same email twice
    },
    threadId: {
      type: String,
      required: true,
    },

    // Email content fields
    subject: {
      type: String,
      default: "(no subject)",
    },
    from: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    snippet: {
      type: String,
      default: "",
    },
    body: {
      type: String,
      default: "", // empty string if Gmail body can't be decoded
    },

    // Status flags — updated as user interacts with the email
    isRead: {
      type: Boolean,
      default: false,
    },
    isReplied: {
      type: Boolean,
      default: false,
    },

    // Claude's analysis — undefined until triage runs
    triageResult: {
      type: TriageResultSchema,
      default: undefined,
    },
  },
  {
    timestamps: true, // createdAt = when WE saved it, not when Gmail received it
  }
);

// Compound index — fast query: "all emails for user X sorted by date"
EmailSchema.index({ userId: 1, createdAt: -1 });

const Email: Model<IEmailDocument> =
  mongoose.models.Email ??
  mongoose.model<IEmailDocument>("Email", EmailSchema);

export default Email;