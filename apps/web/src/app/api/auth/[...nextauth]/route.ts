import { handlers } from "@/lib/auth";

// Hand ALL /api/auth/* requests to NextAuth
// GET  → session checks, sign-in page redirects
// POST → sign-in submissions, sign-out
export const { GET, POST } = handlers;