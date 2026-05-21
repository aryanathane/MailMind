import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Email } from "@mailmind/db";
import { generateDraft } from "@mailmind/ai";
import type { ApiResponse } from "@mailmind/types";

export async function POST(
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

    const email = await Email.findOne({ gmailId: id });
    if (!email) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    if (email.userId !== session.user.googleId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Generate streaming draft
    const stream = await generateDraft(
      email.subject,
      email.from,
      email.body,
    );

    // Return stream directly — browser receives tokens as they arrive
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (err) {
    console.error("POST /api/emails/[id]/draft error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { error: "Draft generation failed" },
      { status: 500 }
    );
  }
}