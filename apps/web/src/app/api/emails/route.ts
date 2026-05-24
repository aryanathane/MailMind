import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Email } from "@mailmind/db";
import { fetchInboxEmails } from "@/lib/gmail";
import type { ApiResponse, ParsedEmail } from "@mailmind/types";

// In-memory cache — prevents repeated Gmail syncs within 5 minutes
const syncCache = new Map<string, number>();
const SYNC_COOLDOWN = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.googleId) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page    = parseInt(searchParams.get("page")  ?? "1");
    const limit   = parseInt(searchParams.get("limit") ?? "20");
    const refresh = searchParams.get("refresh") === "true";
    const skip    = (page - 1) * limit;
    const userId  = session.user.googleId;

    // Check if we have emails in DB
    const existingCount = await Email.countDocuments({ userId });

    // Decide whether to sync Gmail
    const lastSync      = syncCache.get(userId) ?? 0;
    const cooldownPassed = Date.now() - lastSync > SYNC_COOLDOWN;
    const shouldSync    = refresh || existingCount === 0 || cooldownPassed;

    if (shouldSync) {
      if (existingCount === 0) {
        // First time user — must wait for initial sync
        await syncGmail(userId);
      } else {
        // Existing user — sync in background, respond immediately
        syncGmail(userId).catch(console.error);
      }
      syncCache.set(userId, Date.now());
    }

    // Serve from MongoDB instantly
    const [emails, total] = await Promise.all([
      Email.find({ userId })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Email.countDocuments({ userId }),
    ]);

    const response: ParsedEmail[] = (emails as any[]).map((doc) => ({
      id:           doc.gmailId,
      threadId:     doc.threadId,
      subject:      doc.subject,
      from:         doc.from,
      date:         doc.date,
      snippet:      doc.snippet,
      body:         doc.body,
      triageResult: doc.triageResult,
    }));

    return NextResponse.json({
      data: {
        emails:  response,
        total,
        page,
        limit,
        hasMore: skip + limit < total,
        syncing: shouldSync && existingCount > 0,
      },
    });

  } catch (err) {
    console.error("GET /api/emails error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}

async function syncGmail(userId: string): Promise<void> {
  try {
    const gmailEmails = await fetchInboxEmails(userId, 50);

    // Use bulkWrite for efficiency — one DB operation instead of N
    if (gmailEmails.length === 0) return;

    await Email.bulkWrite(
      gmailEmails.map((email) => ({
        updateOne: {
          filter: { gmailId: email.id },
          update: {
            $setOnInsert: {
              userId,
              gmailId:  email.id,
              threadId: email.threadId,
              subject:  email.subject,
              from:     email.from,
              date:     email.date,
              snippet:  email.snippet,
              body:     email.body,
            },
          },
          upsert: true,
        },
      }))
    );
  } catch (err) {
    console.error("Gmail sync error:", err);
    throw err;
  }
}