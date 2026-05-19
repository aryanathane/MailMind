import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Email, Draft } from "@mailmind/db";
import { sendReply } from "@/lib/gmail";
import type { ApiResponse } from "@mailmind/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Step 1 — check session
  const session = await auth();
  if (!session?.user?.googleId) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await connectDB();

    const { id } = await params;

    // Step 2 — parse request body
    // Frontend sends: { body: "reply text", isEdited: true/false }
    const { body, isEdited } = await request.json();

    if (!body || typeof body !== "string" || body.trim() === "") {
      return NextResponse.json<ApiResponse<null>>(
        { error: "Reply body is required" },
        { status: 400 }
      );
    }

    // Step 3 — find email in MongoDB
    const email = await Email.findOne({ gmailId: id });
    if (!email) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    // Step 4 — check ownership
    if (email.userId !== session.user.googleId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Step 5 — prevent sending twice
    if (email.isReplied) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "Already replied to this email" },
        { status: 409 }
      );
    }

    // Step 6 — send via Gmail API
    await sendReply(
      session.user.googleId,
      email.threadId,
      email.from,      // reply goes back to the sender
      email.subject,
      body.trim()
    );

    // Step 7 — update Draft status to "sent" in MongoDB
    await Draft.findOneAndUpdate(
      { emailId: String(email._id) },
      {
        body,                        // save final sent version
        isEdited: isEdited ?? false, // did user edit Claude's draft?
        status:   "sent",
        sentAt:   new Date(),
      }
    );

    // Step 8 — mark email as replied
    await Email.findByIdAndUpdate(email._id, { isReplied: true });

    return NextResponse.json<ApiResponse<{ message: string }>>({
      data: { message: "Reply sent successfully" },
    });

  } catch (err) {
    console.error("POST /api/emails/[id]/send error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}