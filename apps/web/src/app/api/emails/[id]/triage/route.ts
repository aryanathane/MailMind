import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Email } from "@mailmind/db";
import { triageEmail } from "@mailmind/ai";
import type { ApiResponse, TriageResult } from "@mailmind/types";

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

    // Step 2 — find email in MongoDB
    const email = await Email.findOne({ gmailId: id });
    if (!email) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    // Step 3 — check email belongs to this user
    // Prevents users from triaging other users' emails
    if (email.userId !== session.user.googleId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Step 4 — skip if already triaged
    if (email.triageResult) {
      return NextResponse.json<ApiResponse<TriageResult>>({
        data: email.triageResult,
      });
    }

    // Step 5 — run AI triage
    const triageResult = await triageEmail(
      email.subject,
      email.from,
      email.body
    );

    // Step 6 — save result to MongoDB
    await Email.findByIdAndUpdate(email._id, { triageResult });

    // Step 7 — return result to frontend
    return NextResponse.json<ApiResponse<TriageResult>>({
      data: triageResult,
    });

  } catch (err) {
    console.error("POST /api/emails/[id]/triage error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { error: "Triage failed" },
      { status: 500 }
    );
  }
}