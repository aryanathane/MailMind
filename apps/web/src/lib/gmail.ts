import type { ParsedEmail } from "@mailmind/types";
import { getValidAccessToken } from "@/lib/gmail-token";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

// ─── Header helpers ──────────────────────────────────────────────────────────

// Extract a single header value from Gmail's header array
// Gmail returns headers as [{ name: "Subject", value: "Hello" }, ...]
function getHeader(
  headers: { name: string; value: string }[],
  name: string
): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

// ─── Body decoder ────────────────────────────────────────────────────────────

// Gmail encodes email body as base64url (not standard base64)
// base64url uses - and _ instead of + and /
function decodeBase64url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

// Recursively extract plain text body from Gmail payload
// Emails can be: plain text, HTML, or multipart (both)
// We always prefer plain text — simpler to send to Claude
function extractBody(payload: any): string {
  // Direct plain text part
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64url(payload.body.data);
  }

  // Multipart email — recurse into parts to find plain text
  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  // Fallback — HTML email with no plain text version
  if (payload.mimeType === "text/html" && payload.body?.data) {
    // Strip HTML tags for a rough plain text version
    const html = decodeBase64url(payload.body.data);
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  return "";
}

// ─── Main fetch function ──────────────────────────────────────────────────────

export async function fetchInboxEmails(
  googleId: string,
  maxResults = 20
): Promise<ParsedEmail[]> {
  const token = await getValidAccessToken(googleId);

  // Step 1 — Get list of message IDs from inbox
  const listRes = await fetch(
    `${GMAIL_BASE}/messages?maxResults=${maxResults}&labelIds=INBOX`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!listRes.ok) {
    throw new Error(`Gmail list failed: ${listRes.status} ${await listRes.text()}`);
  }

  const listData = await listRes.json();
  const messages: { id: string; threadId: string }[] = listData.messages ?? [];

  if (messages.length === 0) return [];

  // Step 2 — Fetch full email for each ID in parallel
  // format=full gives us headers + body in one request
  const emails = await Promise.all(
    messages.map(async ({ id, threadId }) => {
      const msgRes = await fetch(
        `${GMAIL_BASE}/messages/${id}?format=full`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!msgRes.ok) {
        throw new Error(`Gmail get failed for ${id}: ${msgRes.status}`);
      }

      const msg = await msgRes.json();
      const headers: { name: string; value: string }[] =
        msg.payload?.headers ?? [];

      return {
        id,
        threadId,
        subject:  getHeader(headers, "Subject") || "(no subject)",
        from:     getHeader(headers, "From"),
        date:     getHeader(headers, "Date"),
        snippet:  msg.snippet ?? "",
        body:     extractBody(msg.payload),
      } satisfies ParsedEmail;
    })
  );

  return emails;
}

// ─── Send reply ───────────────────────────────────────────────────────────────

export async function sendReply(
  googleId: string,
  threadId: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const token = await getValidAccessToken(googleId);

  // Gmail requires the email to be base64url encoded RFC 2822 format
  const email = [
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    `In-Reply-To: ${threadId}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ].join("\n");

  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch(`${GMAIL_BASE}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: encodedEmail,
      threadId, // keeps reply in the same thread
    }),
  });

  if (!res.ok) {
    throw new Error(`Gmail send failed: ${res.status} ${await res.text()}`);
  }
}