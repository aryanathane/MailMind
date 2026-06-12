import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getValidAccessToken } from "@/lib/gmail-token";
import { connectDB, User } from "@mailmind/db";
import { checkOrigin } from "@/lib/csrf";
import { GMAIL_WATCH_URL } from "@/lib/constants";

const PROJECT_ID = "mailmind-497011";
const TOPIC_NAME = `projects/${PROJECT_ID}/topics/mailmind-gmail-notifications`;

export async function POST(request: Request) {
  // CSRF check
  const csrfError = checkOrigin(request);
  if (csrfError) return csrfError;

  // Auth check
  const session = await auth();
  if (!session?.user?.googleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getValidAccessToken(session.user.googleId);

    const res = await fetch(GMAIL_WATCH_URL, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topicName: TOPIC_NAME,
        labelIds:  ["INBOX"],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Gmail watch error:", err);
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();

    await connectDB();
    await User.findOneAndUpdate(
      { googleId: session.user.googleId },
      { watchExpiry: new Date(parseInt(data.expiration)) }
    );

    return NextResponse.json({
      data,
      message: "Gmail watch set up successfully",
    });

  } catch (err) {
    console.error("Gmail watch error:", err);
    return NextResponse.json(
      { error: "Failed to set up watch" },
      { status: 500 }
    );
  }
}