import { Router, Request, Response } from "express";
import { triageWorker } from "../jobs/triage-worker";

const router = Router();

// Google Pub/Sub sends push notifications here
// when a new email arrives in a user's Gmail inbox
router.post("/", async (req: Request, res: Response) => {

  // Step 1 — verify the request is from Google
  // Google sends the token we configured as a query parameter
  const token = req.query.token as string;

  if (token !== process.env.PUBSUB_VERIFICATION_TOKEN) {
    console.warn("Webhook received with invalid token — rejected");
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // Step 2 — acknowledge immediately
  // Google expects a 200 response within 10 seconds
  // If we don't respond in time, Google retries the notification
  // So we respond first, then process in background
  res.status(200).json({ received: true });

  try {
    // Step 3 — decode the Pub/Sub message
    // Google sends the message as base64 encoded JSON
    const message = req.body?.message;
    if (!message?.data) {
      console.warn("Webhook received with no message data");
      return;
    }

    const decoded = Buffer.from(message.data, "base64").toString("utf-8");
    const data    = JSON.parse(decoded);

    // Step 4 — extract email address from the notification
    // Google sends: { emailAddress: "user@gmail.com", historyId: "..." }
    const emailAddress = data.emailAddress;
    if (!emailAddress) {
      console.warn("Webhook received with no email address");
      return;
    }

    console.log(`New email notification for: ${emailAddress}`);

    // Step 5 — trigger triage worker in background
    // This fetches new emails and runs AI triage on them
    triageWorker(emailAddress).catch((err) =>
      console.error(`Triage worker failed for ${emailAddress}:`, err)
    );

  } catch (err) {
    console.error("Webhook processing error:", err);
  }
});

export default router;