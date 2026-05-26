import Groq from "groq-sdk";
import { DRAFT_SYSTEM_PROMPT, buildDraftPrompt } from "./prompts";

export async function generateDraft(
  subject: string,
  from: string,
  emailBody: string,
  pastReplies: string[] = []
): Promise<ReadableStream<Uint8Array>> {
  // Instantiate client here — not at module level
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const userMessage = buildDraftPrompt(subject, from, emailBody, pastReplies);

  const groqStream = await client.chat.completions.create({
    model:      "llama-3.3-70b-versatile",
    max_tokens: 1024,
    stream:     true,
    messages: [
      { role: "system", content: DRAFT_SYSTEM_PROMPT },
      { role: "user",   content: userMessage },
    ],
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of groqStream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(new TextEncoder().encode(text));
          }
          if (chunk.choices[0]?.finish_reason === "stop") {
            break;
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
}