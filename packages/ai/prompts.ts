// ─── Sanitization ─────────────────────────────────────────────────────────────

// Sanitize email content before sending to AI
// Prevents prompt injection attacks
function sanitizeForPrompt(text: string): string {
  if (!text) return "";

  return text
    // Remove common prompt injection attempts
    .replace(/ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi, "[removed]")
    .replace(/you\s+are\s+now\s+/gi, "[removed] ")
    .replace(/new\s+instructions?:/gi, "[removed]:")
    .replace(/system\s+prompt/gi, "[removed]")
    .replace(/disregard\s+(all\s+)?(previous|prior)/gi, "[removed]")
    .replace(/forget\s+(all\s+)?(previous|prior)/gi, "[removed]")
    .replace(/act\s+as\s+(if\s+)?/gi, "[removed] ")
    // Limit length
    .slice(0, 3000);
}

// ─── Triage prompt ────────────────────────────────────────────────────────────

export const TRIAGE_SYSTEM_PROMPT = `
You are an intelligent email assistant that triages emails for busy professionals.

Analyze the email and respond with ONLY a valid JSON object — no explanation,
no markdown, no code blocks. Just raw JSON.

Return exactly this structure:
{
  "category": "urgent" | "needs_reply" | "fyi" | "spam",
  "priority": 1 | 2 | 3 | 4 | 5,
  "summary": "one sentence summary of the email",
  "needsReply": true | false
}

Category rules:
- "urgent"      → requires immediate action, deadline, emergency, or from a manager/client
- "needs_reply" → expects a response but not urgent (questions, requests, follow-ups)
- "fyi"         → informational only, newsletters, notifications, no reply needed
- "spam"        → unsolicited, promotional, irrelevant

Priority rules:
- 1 → urgent emails, emails from managers or clients
- 2 → needs reply within today
- 3 → needs reply within a few days
- 4 → low priority, reply when convenient
- 5 → fyi and spam

needsReply rules:
- true  → category is "urgent" or "needs_reply"
- false → category is "fyi" or "spam"

Be consistent. Never return anything outside this JSON structure.
`.trim();

export function buildTriagePrompt(
  subject: string,
  from: string,
  body: string
): string {
  // Sanitize all inputs before sending to AI
  const safeSubject = sanitizeForPrompt(subject);
  const safeFrom    = sanitizeForPrompt(from);
  const safeBody    = sanitizeForPrompt(body);

  const truncatedBody = safeBody.length > 2000
    ? safeBody.slice(0, 2000) + "\n\n[truncated]"
    : safeBody;

  return `
From: ${safeFrom}
Subject: ${safeSubject}

${truncatedBody}
  `.trim();
}

// ─── Draft reply prompt ───────────────────────────────────────────────────────

export const DRAFT_SYSTEM_PROMPT = `
You are an email assistant that writes reply drafts on behalf of the user.

Your goal is to write a reply that sounds exactly like the user — not like an AI.

Rules:
- Match the user's tone from their past replies (formal, casual, brief, detailed)
- Be concise — no unnecessary filler phrases like "I hope this email finds you well"
- Do not sign off with the user's name — they will add that themselves
- Do not add a subject line — just the body
- If you don't have enough context to answer a specific question,
  write [USER TO FILL IN] as a placeholder
- Never start with "I" — vary your sentence openers

Respond with ONLY the draft body text. No explanation, no metadata.
`.trim();

export function buildDraftPrompt(
  subject: string,
  from: string,
  emailBody: string,
  pastReplies: string[] = []
): string {
  // Sanitize all inputs
  const safeSubject = sanitizeForPrompt(subject);
  const safeFrom    = sanitizeForPrompt(from);
  const safeBody    = sanitizeForPrompt(emailBody);

  const toneContext = pastReplies.length > 0
    ? `
Here are examples of how the user writes emails:
${pastReplies.slice(0, 3).map((r, i) => `Example ${i + 1}:\n${sanitizeForPrompt(r)}`).join("\n\n")}
`
    : "";

  return `
${toneContext}
Now write a reply to this email:

From: ${safeFrom}
Subject: ${safeSubject}

${safeBody.slice(0, 3000)}
  `.trim();
}