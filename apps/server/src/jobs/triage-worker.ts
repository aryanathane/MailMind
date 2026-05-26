import Groq from "groq-sdk";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Initialize Groq client lazily — after env is loaded
let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

// ─── Token refresh ────────────────────────────────────────────────────────────

async function getValidToken(user: any): Promise<string> {
  const isExpired = new Date() >= new Date(user.tokenExpiry.getTime() - 60_000);

  if (!isExpired) return user.accessToken;

  // Refresh the token
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: user.refreshToken,
      grant_type:    "refresh_token",
    }),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);

  const data = await res.json();

  // Update token in MongoDB
  const User = mongoose.model("User");
  await User.findByIdAndUpdate(user._id, {
    accessToken: data.access_token,
    tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
  });

  return data.access_token;
}

// ─── Gmail helpers ────────────────────────────────────────────────────────────

function decodeBase64url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function getHeader(headers: any[], name: string): string {
  return headers.find((h: any) =>
    h.name.toLowerCase() === name.toLowerCase()
  )?.value ?? "";
}

function extractBody(payload: any): string {
  function collectParts(part: any): { plain: string; html: string } {
    let plain = "";
    let html  = "";

    if (part.mimeType === "text/plain" && part.body?.data) {
      plain = decodeBase64url(part.body.data);
    } else if (part.mimeType === "text/html" && part.body?.data) {
      html = decodeBase64url(part.body.data);
    }

    if (part.parts) {
      for (const child of part.parts) {
        const result = collectParts(child);
        if (result.plain) plain = result.plain;
        if (result.html)  html  = result.html;
      }
    }

    return { plain, html };
  }

  const { plain, html } = collectParts(payload);
  if (html) return html;
  if (plain.trim()) return plain.trim();
  return "";
}

// ─── AI triage ────────────────────────────────────────────────────────────────

async function runTriage(subject: string, from: string, body: string) {
  const truncatedBody = body.length > 2000
    ? body.slice(0, 2000) + "\n\n[truncated]"
    : body;

  const response = await getGroq().chat.completions.create({
    model:      "llama-3.3-70b-versatile",
    max_tokens: 256,
    messages: [
      {
        role: "system",
        content: `You are an email triage assistant. Analyze the email and respond with ONLY valid JSON:
{
  "category": "urgent" | "needs_reply" | "fyi" | "spam",
  "priority": 1 | 2 | 3 | 4 | 5,
  "summary": "one sentence summary",
  "needsReply": true | false
}`,
      },
      {
        role: "user",
        content: `From: ${from}\nSubject: ${subject}\n\n${truncatedBody}`,
      },
    ],
  });

  const text    = response.choices[0]?.message?.content ?? "";
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

// ─── Main worker ──────────────────────────────────────────────────────────────

export async function triageWorker(emailAddress: string): Promise<void> {
  const User  = mongoose.model("User");
  const Email = mongoose.model("Email");

  // Step 1 — find user by email
  const user = await User.findOne({ email: emailAddress.toLowerCase() });
  if (!user) {
    console.warn(`triageWorker: user not found for ${emailAddress}`);
    return;
  }

  // Step 2 — get valid access token
  const token = await getValidToken(user);

  // Step 3 — fetch latest 10 emails from Gmail
  const listRes = await fetch(
    `${GMAIL_BASE}/messages?maxResults=10&labelIds=INBOX`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!listRes.ok) {
    throw new Error(`Gmail list failed: ${listRes.status}`);
  }

  const listData = await listRes.json();
  const messages: { id: string; threadId: string }[] =
    listData.messages ?? [];

  if (messages.length === 0) return;

  // Step 4 — process each email
  for (const { id, threadId } of messages) {
    try {
      // Skip if already in MongoDB
      const exists = await Email.findOne({ gmailId: id });
      if (exists) {
        // If already exists but not triaged — triage it
        if (!exists.triageResult) {
          const triageResult = await runTriage(
            exists.subject,
            exists.from,
            exists.body
          );
          await Email.findByIdAndUpdate(exists._id, { triageResult });
          console.log(`Triaged existing email: ${exists.subject}`);
        }
        continue;
      }

      // Fetch full email from Gmail
      const msgRes = await fetch(
        `${GMAIL_BASE}/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!msgRes.ok) continue;

      const msg     = await msgRes.json();
      const headers = msg.payload?.headers ?? [];

      const subject = getHeader(headers, "Subject") || "(no subject)";
      const from    = getHeader(headers, "From");
      const date    = getHeader(headers, "Date");
      const snippet = msg.snippet ?? "";
      const body    = extractBody(msg.payload);

      // Step 5 — save to MongoDB
      const email = await Email.create({
        userId:   String(user.googleId),
        gmailId:  id,
        threadId,
        subject,
        from,
        date,
        snippet,
        body,
      });

      // Step 6 — run AI triage
      const triageResult = await runTriage(subject, from, body);
      await Email.findByIdAndUpdate(email._id, { triageResult });

      console.log(`Processed new email: ${subject} → ${triageResult.category}`);

    } catch (err) {
      console.error(`Failed to process email ${id}:`, err);
      // Continue with next email even if one fails
    }
  }

  console.log(`triageWorker completed for ${emailAddress}`);
}