import mongoose from "mongoose";
import Groq from "groq-sdk";

// ─── MongoDB connection caching ────────────────────────────────────────────
// Lambda can reuse the execution environment between invocations.
// We cache the connection here, outside the handler, so a "warm"
// Lambda instance reuses it instead of reconnecting every time.
let cachedConnection = null;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false,
  });
  return cachedConnection;
}

// ─── Mongoose models (inline — Lambda doesn't share your monorepo packages) ─
const UserSchema = new mongoose.Schema({
  email:        String,
  googleId:     String,
  accessToken:  String,
  refreshToken: String,
  tokenExpiry:  Date,
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const TriageResultSchema = new mongoose.Schema(
  {
    category:   { type: String, enum: ["urgent", "needs_reply", "fyi", "spam"] },
    priority:   { type: Number, min: 1, max: 5 },
    summary:    String,
    needsReply: Boolean,
  },
  { _id: false }
);

const EmailSchema = new mongoose.Schema(
  {
    userId:       String,
    gmailId:      { type: String, unique: true },
    threadId:     String,
    subject:      String,
    from:         String,
    date:         String,
    snippet:      String,
    body:         String,
    isRead:       { type: Boolean, default: false },
    isReplied:    { type: Boolean, default: false },
    triageResult: TriageResultSchema,
  },
  { timestamps: true }
);
const Email = mongoose.models.Email || mongoose.model("Email", EmailSchema);

// ─── Gmail helpers ──────────────────────────────────────────────────────────
const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function decodeBase64url(data) {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function getHeader(headers, name) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractBody(payload) {
  function collectParts(part) {
    let plain = "", html = "";
    if (part.mimeType === "text/plain" && part.body?.data) plain = decodeBase64url(part.body.data);
    else if (part.mimeType === "text/html" && part.body?.data) html = decodeBase64url(part.body.data);
    if (part.parts) {
      for (const child of part.parts) {
        const result = collectParts(child);
        if (result.plain) plain = result.plain;
        if (result.html) html = result.html;
      }
    }
    return { plain, html };
  }
  const { plain, html } = collectParts(payload);
  if (html) return html;
  if (plain.trim()) return plain.trim();
  return "";
}

async function getValidToken(user) {
  const isExpired = new Date() >= new Date(user.tokenExpiry.getTime() - 60_000);
  if (!isExpired) return user.accessToken;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: user.refreshToken,
      grant_type:    "refresh_token",
    }),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();

  await User.findByIdAndUpdate(user._id, {
    accessToken: data.access_token,
    tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
  });

  return data.access_token;
}

// ─── AI triage ────────────────────────────────────────────────────────────
async function runTriage(subject, from, body) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const truncatedBody = body.length > 2000 ? body.slice(0, 2000) + "\n\n[truncated]" : body;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
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
      { role: "user", content: `From: ${from}\nSubject: ${subject}\n\n${truncatedBody}` },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

// ─── Main triage worker ─────────────────────────────────────────────────────
async function triageWorker(emailAddress) {
  const user = await User.findOne({ email: emailAddress.toLowerCase() });
  if (!user) {
    console.warn(`User not found for ${emailAddress}`);
    return;
  }

  const token = await getValidToken(user);

  const listRes = await fetch(`${GMAIL_BASE}/messages?maxResults=10&labelIds=INBOX`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) throw new Error(`Gmail list failed: ${listRes.status}`);

  const listData = await listRes.json();
  const messages = listData.messages ?? [];
  if (messages.length === 0) return;

  for (const { id, threadId } of messages) {
    try {
      const exists = await Email.findOne({ gmailId: id });
      if (exists) {
        if (!exists.triageResult) {
          const triageResult = await runTriage(exists.subject, exists.from, exists.body);
          await Email.findByIdAndUpdate(exists._id, { triageResult });
        }
        continue;
      }

      const msgRes = await fetch(`${GMAIL_BASE}/messages/${id}?format=full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!msgRes.ok) continue;

      const msg = await msgRes.json();
      const headers = msg.payload?.headers ?? [];

      const subject = getHeader(headers, "Subject") || "(no subject)";
      const from    = getHeader(headers, "From");
      const date    = getHeader(headers, "Date");
      const snippet = msg.snippet ?? "";
      const body    = extractBody(msg.payload);

      const email = await Email.create({
        userId: String(user.googleId),
        gmailId: id,
        threadId,
        subject,
        from,
        date,
        snippet,
        body,
      });

      const triageResult = await runTriage(subject, from, body);
      await Email.findByIdAndUpdate(email._id, { triageResult });

      console.log(`Processed: ${subject} → ${triageResult.category}`);
    } catch (err) {
      console.error(`Failed to process email ${id}:`, err);
    }
  }
}

// ─── Lambda handler — receives Pub/Sub push notifications ──────────────────
export const handler = async (event) => {
  try {
    // Function URL events pass query params differently than API Gateway
    const queryParams = event.queryStringParameters || {};
    const token = queryParams.token;

    if (token !== process.env.PUBSUB_VERIFICATION_TOKEN) {
      console.warn("Invalid token — rejected");
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }

    const body = JSON.parse(event.body || "{}");
    const message = body?.message;

    if (!message?.data) {
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    const decoded = Buffer.from(message.data, "base64").toString("utf-8");
    const data = JSON.parse(decoded);
    const emailAddress = data.emailAddress;

    if (!emailAddress) {
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    await connectDB();
    await triageWorker(emailAddress);

    return { statusCode: 200, body: JSON.stringify({ processed: true }) };

  } catch (err) {
    console.error("Lambda handler error:", err);
    // Still return 200 so Pub/Sub doesn't endlessly retry
    return { statusCode: 200, body: JSON.stringify({ error: String(err) }) };
  }
};