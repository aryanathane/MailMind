import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true },
    name:         { type: String, required: true },
    image:        { type: String },
    googleId:     { type: String, required: true, unique: true },
    accessToken:  { type: String, required: true },
    refreshToken: { type: String, required: true },
    tokenExpiry:  { type: Date,   required: true },
  },
  { timestamps: true }
);

export default mongoose.models.User ??
  mongoose.model("User", UserSchema);