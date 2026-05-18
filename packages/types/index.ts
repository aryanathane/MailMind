// The 4 categories Claude assigns to every email
export type EmailCategory = "urgent" | "needs_reply" | "fyi" | "spam";

// Lifecycle of an AI-generated reply draft
export type DraftStatus = "pending" | "approved" | "sent" | "discarded";

// Exact shape Claude returns after triaging an email
export interface TriageResult {
  category: EmailCategory;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest, 5 = lowest
  summary: string;               // one-sentence summary of the email
  needsReply: boolean;           // should we generate a draft reply?
}

// A clean, parsed email — Gmail's raw format stripped away
export interface ParsedEmail {
  id: string;               // Gmail message ID
  threadId: string;         // Gmail thread ID (for grouping)
  subject: string;
  from: string;             // "Name <email@example.com>"
  date: string;             // raw date string from Gmail header
  snippet: string;          // Gmail's auto-generated short preview
  body: string;             // full plain-text body, base64-decoded
  triageResult?: TriageResult; // undefined until Claude processes it
}

// Standard wrapper for all API route responses
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Base user shape shared between db model and session
export interface IUser {
  email: string;
  name: string;
  image?: string;
  googleId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}

// Base email shape stored in MongoDB
export interface IEmail {
  userId: string;           // references User._id
  gmailId: string;          // Gmail's message ID — used to fetch/send via API
  threadId: string;         // Gmail thread ID
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
  isRead: boolean;
  isReplied: boolean;
  triageResult?: TriageResult; // added after Claude processes it
}

// Base draft shape stored in MongoDB
export interface IDraft {
  userId: string;      // references User._id
  emailId: string;     // references Email._id (not gmailId)
  body: string;        // Claude's draft, then user's edited version
  isEdited: boolean;   // did user change Claude's draft before sending?
  status: DraftStatus; // pending → approved → sent | discarded
  sentAt?: Date;       // set when Gmail confirms send
}