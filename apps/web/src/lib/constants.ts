// ─── Google API endpoints ─────────────────────────────────────────────────────
// These are well-known public Google API URLs — not secrets
// Centralized here so they're easy to find and update if Google ever changes them

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GMAIL_BASE_URL   = "https://gmail.googleapis.com/gmail/v1/users/me";
export const GMAIL_WATCH_URL  = `${GMAIL_BASE_URL}/watch`;
export const GMAIL_SEND_URL   = `${GMAIL_BASE_URL}/messages/send`;
export const GMAIL_LIST_URL   = `${GMAIL_BASE_URL}/messages`;

// ─── App constants ────────────────────────────────────────────────────────────

export const SYNC_COOLDOWN_MS     = 5 * 60 * 1000;  // 5 minutes
export const TOKEN_EXPIRY_BUFFER  = 60_000;           // 60 seconds
export const MAX_EMAILS_PER_SYNC  = 50;
export const TRIAGE_BATCH_SIZE    = 5;
export const DEFAULT_PAGE_LIMIT   = 20;