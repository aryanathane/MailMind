import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Email, Draft } from "@mailmind/db";
import type { ApiResponse } from "@mailmind/types";

export interface StatsData {
  total:       number;
  triaged:     number;
  replied:     number;
  byCategory:  Record<string, number>;
  replyRate:   number;
  editRate:    number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.googleId) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await connectDB();

    const userId = session.user.googleId;

    const [emails, drafts] = await Promise.all([
      Email.find({ userId }),
      Draft.find({ userId }),
    ]);

    const triaged = emails.filter((e) => e.triageResult);
    const replied = emails.filter((e) => e.isReplied);
    const edited  = drafts.filter((d) => d.isEdited);

    const byCategory = triaged.reduce((acc, e) => {
      const cat = e.triageResult?.category ?? "unknown";
      acc[cat]  = (acc[cat] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json<ApiResponse<StatsData>>({
      data: {
        total:      emails.length,
        triaged:    triaged.length,
        replied:    replied.length,
        byCategory,
        replyRate:  replied.length  / (triaged.length || 1),
        editRate:   edited.length   / (drafts.length  || 1),
      },
    });

  } catch (err) {
    console.error("GET /api/stats error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}