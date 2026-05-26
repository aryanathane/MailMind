import Groq from "groq-sdk";
import type { TriageResult, EmailCategory } from "@mailmind/types";
import { TRIAGE_SYSTEM_PROMPT, buildTriagePrompt } from "./prompts";

const VALID_CATEGORIES: EmailCategory[] = [
  "urgent", "needs_reply", "fyi", "spam",
];

function parseTriageResponse(text: string): TriageResult {
  let parsed: any;
  try {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Invalid JSON from Groq: ${text}`);
  }

  if (!VALID_CATEGORIES.includes(parsed.category)) {
    throw new Error(`Invalid category: ${parsed.category}`);
  }
  if (typeof parsed.priority !== "number" || parsed.priority < 1 || parsed.priority > 5) {
    throw new Error(`Invalid priority: ${parsed.priority}`);
  }
  if (typeof parsed.summary !== "string" || parsed.summary.trim() === "") {
    throw new Error(`Invalid summary: ${parsed.summary}`);
  }
  if (typeof parsed.needsReply !== "boolean") {
    throw new Error(`Invalid needsReply: ${parsed.needsReply}`);
  }

  return {
    category:   parsed.category as EmailCategory,
    priority:   parsed.priority as 1 | 2 | 3 | 4 | 5,
    summary:    parsed.summary.trim(),
    needsReply: parsed.needsReply,
  };
}

export async function triageEmail(
  subject: string,
  from: string,
  body: string
): Promise<TriageResult> {
  // Instantiate client here — not at module level
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const userMessage = buildTriagePrompt(subject, from, body);

  const response = await client.chat.completions.create({
    model:      "llama-3.3-70b-versatile",
    max_tokens: 256,
    messages: [
      { role: "system", content: TRIAGE_SYSTEM_PROMPT },
      { role: "user",   content: userMessage },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  return parseTriageResponse(text);
}