import mongoose, { Document, Model, Schema } from "mongoose";
import type { IDraft } from "@mailmind/types";

export interface IDraftDocument extends IDraft, Document {}

const DraftSchema = new Schema<IDraftDocument>(
  {
    // Links draft to a user — needed to check ownership before sending
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // Links draft to the email it replies to
    // We use Email._id (MongoDB id), not gmailId
    emailId: {
      type: String,
      required: true,
      unique: true, // one draft per email — no duplicates
    },

    // The reply text — starts as Claude's output
    // Updated in-place when user edits it in the editor
    body: {
      type: String,
      required: true,
    },

    // Tracks whether user changed Claude's original draft
    // Useful for analytics: how often does Claude nail it first try?
    isEdited: {
      type: Boolean,
      default: false, // false = user sent Claude's draft unchanged
    },

    // Lifecycle status — moves forward, never backwards
    // pending   → user hasn't reviewed yet
    // approved  → user clicked "Send" button
    // sent      → Gmail API confirmed delivery
    // discarded → user deleted the draft
    status: {
      type: String,
      enum: ["pending", "approved", "sent", "discarded"],
      default: "pending",
    },

    // Only set when status becomes "sent"
    // Lets us show "Sent 2 hours ago" in the UI
    sentAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true, // createdAt = when Claude generated this draft
  }
);

// Fast lookup: "show me all pending drafts for user X"
DraftSchema.index({ userId: 1, status: 1 });

const Draft: Model<IDraftDocument> =
  mongoose.models.Draft ??
  mongoose.model<IDraftDocument>("Draft", DraftSchema);

export default Draft;