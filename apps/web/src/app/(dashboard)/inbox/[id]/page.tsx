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

  const [email,          setEmail]          = useState<ParsedEmail | null>(null);
  const [draft,          setDraft]          = useState("");
  const [loading,        setLoading]        = useState(true);
  const [draftLoading,   setDraftLoading]   = useState(false);
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [sending,        setSending]        = useState(false);
  const [sent,           setSent]           = useState(false);
  const [error,          setError]          = useState("");
  const [isEdited,       setIsEdited]       = useState(false);
  const originalDraft                       = useRef("");

  // Fetch single email by ID — much faster than fetching all
  useEffect(() => {
    fetch(`/api/emails/${id}`)
      .then((r) => r.json())
      .then((res) => setEmail(res.data ?? null))
      .catch(() => setError("Failed to load email"))
      .finally(() => setLoading(false));
  }, [id]);

  // Generate draft once email loads and needs reply
  useEffect(() => {
    if (!email || !email.triageResult?.needsReply || draftGenerated) return;

    setDraftLoading(true);
    setDraftGenerated(true);

    fetch(`/api/emails/${id}/draft`, { method: "POST" })
      .then(async (res) => {
        if (!res.ok || !res.body) {
          setDraftLoading(false);
          return;
        }

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
        setDraftLoading(false);
      })
      .catch(() => setDraftLoading(false));
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

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        color: "#7a94b0", fontSize: 13, marginBottom: 24,
      }}>← Back to inbox</div>

      {/* Header skeleton */}
      <div style={{
        background: "#FFFFFF", border: "1px solid #D4E3F0",
        borderRadius: 16, padding: "24px 28px", marginBottom: 16,
      }}>
        <div style={{ height: 24, background: "#EBF2FA", borderRadius: 4, width: "60%", marginBottom: 16 }}/>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EBF2FA" }}/>
          <div>
            <div style={{ height: 13, background: "#EBF2FA", borderRadius: 4, width: 120, marginBottom: 6 }}/>
            <div style={{ height: 11, background: "#EBF2FA", borderRadius: 4, width: 180 }}/>
          </div>
        </div>
      </div>

      {/* Body skeleton */}
      <div style={{
        background: "#FFFFFF", border: "1px solid #D4E3F0",
        borderRadius: 16, padding: "24px 28px",
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            height: 13, background: "#EBF2FA",
            borderRadius: 4, marginBottom: 10,
            width: `${70 + Math.random() * 25}%`,
          }}/>
        ))}
      </div>
    </div>
  );

  if (!email) return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "60vh", gap: 12,
    }}>
      <div style={{ fontSize: 36 }}>📭</div>
      <p style={{ color: "#7a94b0", fontSize: 14 }}>Email not found.</p>
      <Link href="/inbox" style={{
        color: "#3674B5", fontSize: 13, textDecoration: "none",
        padding: "8px 16px", background: "#EBF3FB",
        borderRadius: 8, border: "1px solid #C5DCF2",
      }}>
        ← Back to inbox
      </Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200 }}>

      {/* Back */}
      <Link href="/inbox" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        color: "#7a94b0", fontSize: 13, textDecoration: "none",
        marginBottom: 24, transition: "color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3674B5"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#7a94b0"}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to inbox
      </Link>

      {/* Email header card */}
      <div style={{
        background: "#FFFFFF",
        border: "1px solid #D4E3F0",
        borderRadius: 16, padding: "24px 28px",
        marginBottom: 16,
      }}>
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 16, marginBottom: 16,
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: 19, fontWeight: 600,
              color: "#1a2744", letterSpacing: "-0.2px",
              marginBottom: 12,
            }}>{email.subject}</h1>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "#3674B5",
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 13,
                color: "#FFFFFF", fontWeight: 600, flexShrink: 0,
              }}>
                {extractName(email.from).charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{
                  fontSize: 14, fontWeight: 500, color: "#1a2744",
                }}>
                  {extractName(email.from)}
                </div>
                <div style={{ fontSize: 12, color: "#7a94b0" }}>
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
            <span style={{ fontSize: 12, color: "#a8bdd1" }}>{email.date}</span>
          </div>
        </div>

        {/* AI summary */}
        {email.triageResult?.summary && (
          <div style={{
            background: "#EBF3FB",
            border: "1px solid #C5DCF2",
            borderRadius: 8, padding: "10px 14px",
            fontSize: 13, color: "#1A5FA8",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3674B5" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
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
          background: "#FFFFFF",
          border: "1px solid #D4E3F0",
          borderRadius: 16, padding: "24px 28px",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 500,
            color: "#a8bdd1", letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 16,
          }}>Original Email</div>

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
              fontSize: 14, color: "#3d5a80",
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
            background: "#FFFFFF",
            border: "1px solid #D4E3F0",
            borderRadius: 16, padding: "24px 28px",
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{
                fontSize: 11, fontWeight: 500,
                color: "#a8bdd1", letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>AI Draft Reply</div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {draftLoading && (
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: 6, fontSize: 12, color: "#578FCA",
                  }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: "50%",
                      border: "2px solid #A1E3F9",
                      borderTopColor: "#3674B5",
                      animation: "spin 0.8s linear infinite",
                    }}/>
                    Generating…
                  </div>
                )}
                {isEdited && !draftLoading && (
                  <span style={{
                    fontSize: 11, color: "#B55A1A",
                    background: "#FEF3E8",
                    border: "1px solid #F8D5B4",
                    padding: "2px 8px", borderRadius: 20,
                  }}>Edited</span>
                )}
              </div>
            </div>

            {/* Textarea */}
            <div style={{ position: "relative", flex: 1 }}>
              <textarea
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                placeholder={draftLoading ? "" : "No draft generated yet"}
                style={{
                  width: "100%", minHeight: 320,
                  background: draftLoading ? "#FAFCFF" : "#FFFFFF",
                  border: "1px solid #D4E3F0",
                  borderRadius: 10, padding: "16px",
                  color: "#1a2744", fontSize: 14,
                  lineHeight: 1.8,
                  fontFamily: "'Inter', sans-serif",
                  resize: "vertical", outline: "none",
                  transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#578FCA"}
                onBlur={e  => e.target.style.borderColor = "#D4E3F0"}
              />

              {/* Generating overlay */}
              {draftLoading && draft === "" && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 10,
                  color: "#7a94b0", fontSize: 13,
                  pointerEvents: "none",
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid #D4E3F0",
                    borderTopColor: "#3674B5",
                    animation: "spin 0.8s linear infinite",
                  }}/>
                  Writing your reply…
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                fontSize: 13, color: "#C0392B",
                background: "#FDECEA",
                border: "1px solid #F5C6C2",
                borderRadius: 8, padding: "10px 14px",
              }}>{error}</div>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending || sent || !draft.trim() || draftLoading}
              style={{
                padding: "12px 20px",
                background: sent
                  ? "#E8F8F2"
                  : sending || draftLoading
                  ? "#EBF3FB"
                  : "#3674B5",
                border: sent
                  ? "1px solid #A8E6CC"
                  : "none",
                borderRadius: 10,
                color: sent
                  ? "#1a9c6e"
                  : sending || draftLoading
                  ? "#7a94b0"
                  : "#FFFFFF",
                fontSize: 14, fontWeight: 500,
                cursor: sending || sent || draftLoading
                  ? "not-allowed" : "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.2s",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
              }}
              onMouseEnter={e => {
                if (!sending && !sent && !draftLoading) {
                  (e.currentTarget as HTMLElement).style.background = "#2d63a0";
                }
              }}
              onMouseLeave={e => {
                if (!sending && !sent && !draftLoading) {
                  (e.currentTarget as HTMLElement).style.background = "#3674B5";
                }
              }}
            >
              {sent ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Sent — returning to inbox
                </>
              ) : sending ? "Sending…" : draftLoading ? "Generating draft…" : (
                <>
                  Send Reply
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}