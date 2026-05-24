import type { ParsedEmail } from "@mailmind/types";
import { getValidAccessToken } from "@/lib/gmail-token";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

function getHeader(
  headers: { name: string; value: string }[],
  name: string
): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ""
  );
}

function decodeBase64url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
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
  if (html) return html;
  if (plain.trim()) return plain.trim();
  return "";
}

// Limit concurrent requests to avoid Gmail rate limits
async function batchFetch<T>(
  items: T[],
  fn: (item: T) => Promise<any>,
  concurrency = 5
): Promise<any[]> {
  const results: any[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export async function fetchInboxEmails(
  googleId: string,
  maxResults = 50
): Promise<ParsedEmail[]> {
  const token = await getValidAccessToken(googleId);

  // Step 1 — get message IDs only (fast — single request)
  const listRes = await fetch(
    `${GMAIL_BASE}/messages?maxResults=${maxResults}&labelIds=INBOX`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!listRes.ok) {
    throw new Error(`Gmail list failed: ${listRes.status}`);
  }

  const listData = await listRes.json();
  const messages: { id: string; threadId: string }[] = listData.messages ?? [];
  if (messages.length === 0) return [];

  // Step 2 — fetch full emails in batches of 5 (not all at once)
  const emails = await batchFetch(
    messages,
    async ({ id, threadId }: { id: string; threadId: string }) => {
      const msgRes = await fetch(
        // metadata+body format is faster than full
        `${GMAIL_BASE}/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!msgRes.ok) return null;

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
    },
    5 // 5 concurrent requests max
  );

  return emails.filter(Boolean);
}

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
    body: JSON.stringify({ raw: encodedEmail, threadId }),
  });

  if (!res.ok) {
    throw new Error(`Gmail send failed: ${res.status} ${await res.text()}`);
  }
}