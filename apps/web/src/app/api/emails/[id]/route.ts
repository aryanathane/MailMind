import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Email } from "@mailmind/db";
import type { ApiResponse, ParsedEmail } from "@mailmind/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const email = await Email.findOne({
      gmailId: id,
      userId:  session.user.googleId,
    }).lean();

    if (!email) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    const response: ParsedEmail = {
      id:           (email as any).gmailId,
      threadId:     (email as any).threadId,
      subject:      (email as any).subject,
      from:         (email as any).from,
      date:         (email as any).date,
      snippet:      (email as any).snippet,
      body:         (email as any).body,
      triageResult: (email as any).triageResult,
    };

    return NextResponse.json<ApiResponse<ParsedEmail>>({ data: response });

  } catch (err) {
    console.error("GET /api/emails/[id] error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch email" },
      { status: 500 }
    );
  }
}