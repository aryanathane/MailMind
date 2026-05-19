// ─── Triage prompt ────────────────────────────────────────────────────────────

// System prompt runs once — sets Claude's role and output format
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

// Builds the user message for triage — called once per email
export function buildTriagePrompt(
  subject: string,
  from: string,
  body: string
): string {
  // Truncate body to 2000 chars — long emails don't need full text for triage
  const truncatedBody = body.length > 2000
    ? body.slice(0, 2000) + "\n\n[email truncated]"
    : body;

  return `
From: ${from}
Subject: ${subject}

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

// Builds the user message for draft generation
export function buildDraftPrompt(
  subject: string,
  from: string,
  emailBody: string,
  pastReplies: string[] = [] // user's previous sent emails for tone matching
): string {
  // Include up to 3 past replies as tone examples
  const toneContext = pastReplies.length > 0
    ? `
Here are examples of how the user writes emails:
${pastReplies.slice(0, 3).map((r, i) => `Example ${i + 1}:\n${r}`).join("\n\n")}
`
    : "";

  return `
${toneContext}
Now write a reply to this email:

From: ${from}
Subject: ${subject}

${emailBody.slice(0, 3000)}
  `.trim();
}