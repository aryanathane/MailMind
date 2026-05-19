import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Email } from "@mailmind/db";
import { fetchInboxEmails } from "@/lib/gmail";
import type { ApiResponse, ParsedEmail } from "@mailmind/types";

export async function GET() {
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

    // Step 2 — fetch emails from Gmail
    const gmailEmails = await fetchInboxEmails(session.user.googleId);

    // Step 3 — save new emails to MongoDB (skip duplicates)
    const savePromises = gmailEmails.map(async (email) => {
      const exists = await Email.findOne({ gmailId: email.id });
      if (exists) return exists; // already saved — skip

      // Save new email to MongoDB
      return Email.create({
        userId:   session.user.googleId,
        gmailId:  email.id,
        threadId: email.threadId,
        subject:  email.subject,
        from:     email.from,
        date:     email.date,
        snippet:  email.snippet,
        body:     email.body,
      });
    });

    const savedEmails = await Promise.all(savePromises);

    // Step 4 — return emails to frontend
    // Map MongoDB documents back to ParsedEmail shape
    const response: ParsedEmail[] = savedEmails.map((doc) => ({
      id:           doc.gmailId,
      threadId:     doc.threadId,
      subject:      doc.subject,
      from:         doc.from,
      date:         doc.date,
      snippet:      doc.snippet,
      body:         doc.body,
      triageResult: doc.triageResult,
    }));

    return NextResponse.json<ApiResponse<ParsedEmail[]>>({ data: response });

  } catch (err) {
    console.error("GET /api/emails error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}