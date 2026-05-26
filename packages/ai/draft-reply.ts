import Groq from "groq-sdk";
import { DRAFT_SYSTEM_PROMPT, buildDraftPrompt } from "./prompts";

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

// Returns a ReadableStream — pipe this directly to the API response
// The browser receives words as they're generated, not all at once
export async function generateDraft(
  subject: string,
  from: string,
  emailBody: string,
  pastReplies: string[] = []
): Promise<ReadableStream<Uint8Array>> {
  const userMessage = buildDraftPrompt(subject, from, emailBody, pastReplies);

  // Create a streaming completion
  const groqStream = await getClient().chat.completions.create({
    model:      "llama-3.3-70b-versatile",
    max_tokens: 1024, // drafts can be longer than triage responses
    stream:     true, // key difference from triage — stream tokens as generated
    messages: [
      { role: "system", content: DRAFT_SYSTEM_PROMPT },
      { role: "user",   content: userMessage },
    ],
  });

  // Convert Groq's async iterator into a Web ReadableStream
  // Next.js API routes return Web streams — not Node.js streams
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of groqStream) {
          // Each chunk contains a delta — the next piece of text
          const text = chunk.choices[0]?.delta?.content ?? "";

          if (text) {
            // Encode text to bytes and push to stream
            controller.enqueue(new TextEncoder().encode(text));
          }

          // Stop reason "stop" means generation is complete
          if (chunk.choices[0]?.finish_reason === "stop") {
            break;
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        // Always close the stream when done
        controller.close();
      }
    },
  });
}