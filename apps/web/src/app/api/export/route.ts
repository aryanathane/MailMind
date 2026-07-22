import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Email } from "@mailmind/db";
import { uploadToS3, getPresignedUrl } from "@/lib/s3";
import type { ApiResponse } from "@mailmind/types";

export async function POST(request: Request) {
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

    const { format } = (await request.json()) as { format: "json" | "csv" };

    const emails = await Email.find({ userId }).lean();
    const triaged = emails.filter((e: any) => e.triageResult);
    const replied = emails.filter((e: any) => e.isReplied);

    const byCategory = triaged.reduce((acc: any, e: any) => {
      const cat = e.triageResult?.category ?? "unknown";
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {});

    const exportRows = (emails as any[]).map((e) => ({
      subject:  e.subject,
      from:     e.from,
      date:     e.date,
      category: e.triageResult?.category ?? "unprocessed",
      priority: e.triageResult?.priority ?? "",
      summary:  e.triageResult?.summary ?? "",
      replied:  e.isReplied,
    }));

    let content: string;
    let contentType: string;
    let extension: string;

    if (format === "csv") {
      const headers = ["subject", "from", "date", "category", "priority", "summary", "replied"];
      const rows = exportRows.map((row) =>
        headers
          .map((h) => {
            const val = (row as any)[h] ?? "";
            return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
          })
          .join(",")
      );
      content = [headers.join(","), ...rows].join("\n");
      contentType = "text/csv";
      extension = "csv";
    } else {
      content = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          summary: {
            totalEmails: emails.length,
            triaged: triaged.length,
            replied: replied.length,
            byCategory,
          },
          emails: exportRows,
        },
        null,
        2
      );
      contentType = "application/json";
      extension = "json";
    }

    const key = `exports/${userId}/${Date.now()}.${extension}`;
    await uploadToS3(key, content, contentType);
    const downloadUrl = await getPresignedUrl(key, 900);

    return NextResponse.json<ApiResponse<{ downloadUrl: string }>>({
      data: { downloadUrl },
    });

  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}