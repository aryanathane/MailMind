"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ParsedEmail } from "@mailmind/types";
import CategoryBadge from "@/components/CategoryBadge";
import Link from "next/link";

function extractName(from: string): string {
  const match = from.match(/^([^<]+)/);
  return match ? match[1].trim() : from;
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

function isHtml(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

export default function EmailDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [email,    setEmail]    = useState<ParsedEmail | null>(null);
  const [draft,    setDraft]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState("");
  const [isEdited, setIsEdited] = useState(false);
  const originalDraft           = useRef("");

  useEffect(() => {
    fetch("/api/emails")
      .then((r) => r.json())
      .then((res) => {
        const found = (res.data ?? []).find((e: ParsedEmail) => e.id === id);
        setEmail(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!email || !email.triageResult?.needsReply || draft) return;

    fetch(`/api/emails/${id}/draft`, { method: "POST" })
      .then(async (res) => {
        if (!res.ok || !res.body) return;

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let text      = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setDraft(text);
        }

        originalDraft.current = text;
      });
  }, [email]);

  const handleDraftChange = (val: string) => {
    setDraft(val);
    setIsEdited(val !== originalDraft.current);
  };

  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/emails/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft, isEdited }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");

      setSent(true);
      setTimeout(() => router.push("/inbox"), 1500);
    } catch (err: any) {
      setError(err.message);
      setSending(false);
    }
  };

  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "center", height: "60vh",
      color: "#6b6b8a", fontSize: 14,
    }}>
      Loading email…
    </div>
  );

  if (!email) return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "center", height: "60vh",
      color: "#6b6b8a", fontSize: 14,
    }}>
      Email not found.{" "}
      <Link href="/inbox" style={{ color: "#6366f1", marginLeft: 6 }}>
        Back to inbox
      </Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200 }}>

      {/* Back */}
      <Link href="/inbox" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        color: "#6b6b8a", fontSize: 13, textDecoration: "none",
        marginBottom: 24,
      }}>
        ← Back to inbox
      </Link>

      {/* Email header card */}
      <div style={{
        background: "#0f0f1a",
        border: "1px solid #1e1e35",
        borderRadius: 16,
        padding: "24px 28px",
        marginBottom: 16,
      }}>
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 16,
          marginBottom: 16,
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: 20, fontWeight: 600,
              color: "#f0f0ff", letterSpacing: "-0.3px",
              marginBottom: 10,
            }}>{email.subject}</h1>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `hsl(${extractEmail(email.from).charCodeAt(0) * 7 % 360}, 40%, 25%)`,
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 14,
                color: "#e2e2f0", fontWeight: 500, flexShrink: 0,
              }}>
                {extractName(email.from).charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#c0c0d8" }}>
                  {extractName(email.from)}
                </div>
                <div style={{ fontSize: 12, color: "#6b6b8a" }}>
                  {extractEmail(email.from)}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "flex-end", gap: 8,
          }}>
            {email.triageResult && (
              <CategoryBadge category={email.triageResult.category} size="md" />
            )}
            <span style={{ fontSize: 12, color: "#45455a" }}>{email.date}</span>
          </div>
        </div>

        {/* AI summary */}
        {email.triageResult?.summary && (
          <div style={{
            background: "#6366f110",
            border: "1px solid #6366f125",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 13, color: "#9090c8",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>✦</span>
            {email.triageResult.summary}
          </div>
        )}
      </div>

      {/* Two column layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: email.triageResult?.needsReply ? "1fr 1fr" : "1fr",
        gap: 16,
      }}>

        {/* Email body */}
        <div style={{
          background: "#0f0f1a",
          border: "1px solid #1e1e35",
          borderRadius: 16,
          padding: "24px 28px",
        }}>
          <h2 style={{
            fontSize: 12, fontWeight: 500,
            color: "#45455a", letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 16,
          }}>Original Email</h2>

          {isHtml(email.body) ? (
            <iframe
              srcDoc={email.body}
              style={{
                width: "100%", height: 460,
                border: "none", borderRadius: 8,
                background: "#fff",
              }}
              sandbox="allow-same-origin"
              title="Email content"
            />
          ) : (
            <div style={{
              fontSize: 14, color: "#b0b0c8",
              lineHeight: 1.8, whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 500, overflowY: "auto",
            }}>
              {email.body || email.snippet || "(No content)"}
            </div>
          )}
        </div>

        {/* Draft reply */}
        {email.triageResult?.needsReply && (
          <div style={{
            background: "#0f0f1a",
            border: "1px solid #1e1e35",
            borderRadius: 16,
            padding: "24px 28px",
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
            }}>
              <h2 style={{
                fontSize: 12, fontWeight: 500,
                color: "#45455a", letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>AI Draft Reply</h2>

              {isEdited && (
                <span style={{
                  fontSize: 11, color: "#fb923c",
                  background: "#fb923c10",
                  border: "1px solid #fb923c25",
                  padding: "2px 8px", borderRadius: 20,
                }}>Edited</span>
              )}
            </div>

            <textarea
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              placeholder={draft ? "" : "Generating draft…"}
              style={{
                flex: 1, minHeight: 320,
                background: "#ffffff05",
                border: "1px solid #1e1e35",
                borderRadius: 10, padding: "16px",
                color: "#e2e2f0", fontSize: 14,
                lineHeight: 1.8,
                fontFamily: "'DM Sans', sans-serif",
                resize: "vertical", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = "#6366f150"}
              onBlur={e  => e.target.style.borderColor = "#1e1e35"}
            />

            {error && (
              <div style={{
                fontSize: 13, color: "#f87171",
                background: "#f8717110",
                border: "1px solid #f8717125",
                borderRadius: 8, padding: "8px 14px",
              }}>{error}</div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || sent || !draft.trim()}
              style={{
                padding: "12px 20px",
                background: sent
                  ? "#22c55e20"
                  : sending
                  ? "#6366f130"
                  : "linear-gradient(135deg, #6366f1, #818cf8)",
                border: sent ? "1px solid #22c55e40" : "none",
                borderRadius: 10,
                color: sent ? "#22c55e" : "#fff",
                fontSize: 14, fontWeight: 600,
                cursor: sending || sent ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
              }}
            >
              {sent
                ? "✓ Sent — returning to inbox"
                : sending
                ? "Sending…"
                : "Send Reply →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}