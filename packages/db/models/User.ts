import mongoose, { Document, Model, Schema } from "mongoose";
import type { IUser } from "@mailmind/types";

// Extend the base Document type with our user fields
export interface IUserDocument extends IUser, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    // Google identity fields
    email: {
      type: String,
      required: true,
      unique: true,    // one document per email address
      lowercase: true, // always stored as lowercase
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,    // profile picture URL from Google
    },
    googleId: {
      type: String,
      required: true,
      unique: true,    // one document per Google account
    },

    // OAuth token fields — updated every time user signs in
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,  // MUST have this to refresh access token later
    },
    tokenExpiry: {
      type: Date,
      required: true,  // we check this before every Gmail API call
    },
  },
  {
    timestamps: true, // auto-adds createdAt and updatedAt fields
  }
);

// Prevent model re-registration during Next.js hot reload in dev
const User: Model<IUserDocument> =
  mongoose.models.User ??
  mongoose.model<IUserDocument>("User", UserSchema);

export default User;