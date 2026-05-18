// Connection utility
export { connectDB } from "./lib/db";

// All models — import what you need from @mailmind/db
export { default as User } from "./models/User";
export { default as Email } from "./models/Email";
export { default as Draft } from "./models/Draft";

// Document types — for TypeScript usage in other packages
export type { IUserDocument } from "./models/User";
export type { IEmailDocument } from "./models/Email";
export type { IDraftDocument } from "./models/Draft";