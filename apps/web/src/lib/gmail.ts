import type { ParsedEmail } from "@mailmind/types";
import { getValidAccessToken } from "@/lib/gmail-token";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

// ─── Header helper ────────────────────────────────────────────────────────────

function getHeader(
  headers: { name: string; value: string }[],
  name: string
): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ""
  );
}

// ─── Base64url decoder ────────────────────────────────────────────────────────

function decodeBase64url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

// ─── Body extractor ───────────────────────────────────────────────────────────

function extractBody(payload: any): string {
  function collectParts(part: any): { plain: string; html: string } {
    let plain = "";
    let html  = "";

    if (part.mimeType === "text/plain" && part.body?.data) {
      plain = decodeBase64url(part.body.data);
    } else if (part.mimeType === "text/html" && part.body?.data) {
      html = decodeBase64url(part.body.data);
    }

    if (part.parts && Array.isArray(part.parts)) {
      for (const child of part.parts) {
        const result = collectParts(child);
        if (result.plain) plain = result.plain;
        if (result.html)  html  = result.html;
      }
    }

    return { plain, html };
  }

  const { plain, html } = collectParts(payload);

  // Prefer HTML if available — rendered safely in iframe
  if (html) return html;

  // Fall back to plain text
  if (plain.trim()) return plain.trim();

  return "";
}

// ─── Fetch inbox emails ───────────────────────────────────────────────────────

export async function fetchInboxEmails(
  googleId: string,
  maxResults = 20
): Promise<ParsedEmail[]> {
  const token = await getValidAccessToken(googleId);

  const listRes = await fetch(
    `${GMAIL_BASE}/messages?maxResults=${maxResults}&labelIds=INBOX`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!listRes.ok) {
    throw new Error(`Gmail list failed: ${listRes.status} ${await listRes.text()}`);
  }

  const listData = await listRes.json();
  const messages: { id: string; threadId: string }[] = listData.messages ?? [];
  if (messages.length === 0) return [];

  const emails = await Promise.all(
    messages.map(async ({ id, threadId }) => {
      const msgRes = await fetch(
        `${GMAIL_BASE}/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!msgRes.ok) {
        throw new Error(`Gmail get failed for ${id}: ${msgRes.status}`);
      }

      const msg = await msgRes.json();
      const headers: { name: string; value: string }[] = msg.payload?.headers ?? [];

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
      threadId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gmail send failed: ${res.status} ${await res.text()}`);
  }
}