"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ParsedEmail } from "@mailmind/types";
import CategoryBadge from "@/components/CategoryBadge";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const isMobile = useIsMobile();

  const [email,          setEmail]          = useState<ParsedEmail | null>(null);
  const [draft,          setDraft]          = useState("");
  const [loading,        setLoading]        = useState(true);
  const [draftLoading,   setDraftLoading]   = useState(false);
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [sending,        setSending]        = useState(false);
  const [sent,           setSent]           = useState(false);
  const [error,          setError]          = useState("");
  const [isEdited,       setIsEdited]       = useState(false);
  const [showDraft,      setShowDraft]      = useState(false);
  const originalDraft                       = useRef("");

  useEffect(() => {
    fetch(`/api/emails/${id}`)
      .then((r) => r.json())
      .then((res) => setEmail(res.data ?? null))
      .catch(() => setError("Failed to load email"))
      .finally(() => setLoading(false));
  }, [id]);

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
        // Auto show draft on desktop, show toggle on mobile
        if (!isMobile) setShowDraft(true);
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
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ body: draft, isEdited }),
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

  // ─── Loading skeleton ─────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ maxWidth: 1200, padding: isMobile ? "0" : undefined }}>
      <div style={{
        background: "#FFFFFF", border: "1px solid #D4E3F0",
        borderRadius: 16, padding: "24px",
        marginBottom: 16,
      }}>
        <div style={{ height: 22, background: "#EBF2FA", borderRadius: 4, width: "60%", marginBottom: 16 }}/>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EBF2FA" }}/>
          <div>
            <div style={{ height: 13, background: "#EBF2FA", borderRadius: 4, width: 120, marginBottom: 6 }}/>
            <div style={{ height: 11, background: "#EBF2FA", borderRadius: 4, width: 180 }}/>
          </div>
        </div>
      </div>
      <div style={{
        background: "#FFFFFF", border: "1px solid #D4E3F0",
        borderRadius: 16, padding: "24px",
      }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            height: 13, background: "#EBF2FA",
            borderRadius: 4, marginBottom: 10,
            width: `${65 + (i % 3) * 10}%`,
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
      <div style={{ fontSize: 32 }}>📭</div>
      <p style={{ color: "#7a94b0", fontSize: 14 }}>Email not found.</p>
      <Link href="/inbox" style={{
        color: "#3674B5", fontSize: 13, textDecoration: "none",
        padding: "8px 16px", background: "#EBF3FB",
        borderRadius: 8, border: "1px solid #C5DCF2",
      }}>← Back to inbox</Link>
    </div>
  );

  const needsReply = email.triageResult?.needsReply;

  return (
    <div style={{ maxWidth: isMobile ? "100%" : 1200 }}>

      {/* Back */}
      <Link href="/inbox" style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            6,
        color:          "#7a94b0",
        fontSize:       13,
        textDecoration: "none",
        marginBottom:   16,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to inbox
      </Link>

      {/* Email header */}
      <div style={{
        background:   "#FFFFFF",
        border:       "1px solid #D4E3F0",
        borderRadius: 16,
        padding:      isMobile ? "16px" : "24px 28px",
        marginBottom: 12,
      }}>
        <div style={{
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          gap:            12,
          marginBottom:   12,
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize:      isMobile ? 15 : 19,
              fontWeight:    600,
              color:         "#1a2744",
              letterSpacing: "-0.2px",
              marginBottom:  10,
              lineHeight:    1.3,
            }}>{email.subject}</h1>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width:          isMobile ? 30 : 36,
                height:         isMobile ? 30 : 36,
                borderRadius:   "50%",
                background:     "#3674B5",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       12,
                color:          "#FFFFFF",
                fontWeight:     600,
                flexShrink:     0,
              }}>
                {extractName(email.from).charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 500, color: "#1a2744" }}>
                  {extractName(email.from)}
                </div>
                <div style={{ fontSize: isMobile ? 10 : 12, color: "#7a94b0" }}>
                  {extractEmail(email.from)}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display:       "flex",
            flexDirection: "column",
            alignItems:    "flex-end",
            gap:           6,
          }}>
            {email.triageResult && (
              <CategoryBadge category={email.triageResult.category} size="md" />
            )}
            <span style={{ fontSize: isMobile ? 10 : 12, color: "#a8bdd1" }}>
              {email.date}
            </span>
          </div>
        </div>

        {/* AI summary */}
        {email.triageResult?.summary && (
          <div style={{
            background:   "#EBF3FB",
            border:       "1px solid #C5DCF2",
            borderRadius: 8,
            padding:      "8px 12px",
            fontSize:     isMobile ? 12 : 13,
            color:        "#1A5FA8",
            display:      "flex",
            alignItems:   "center",
            gap:          8,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3674B5" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {email.triageResult.summary}
          </div>
        )}
      </div>

      {/* Mobile: toggle between email and draft */}
      {isMobile && needsReply && (
        <div style={{
          display:       "flex",
          background:    "#FFFFFF",
          border:        "1px solid #D4E3F0",
          borderRadius:  10,
          padding:       4,
          marginBottom:  12,
          gap:           4,
        }}>
          {["Email", "Draft Reply"].map((tab) => {
            const active = tab === "Email" ? !showDraft : showDraft;
            return (
              <button
                key={tab}
                onClick={() => setShowDraft(tab === "Draft Reply")}
                style={{
                  flex:        1,
                  padding:     "7px 0",
                  borderRadius: 7,
                  border:      "none",
                  background:  active ? "#3674B5" : "transparent",
                  color:       active ? "#FFFFFF" : "#3d5a80",
                  fontSize:    13,
                  fontWeight:  active ? 500 : 400,
                  cursor:      "pointer",
                  fontFamily:  "'Inter', sans-serif",
                }}
              >
                {tab}
                {tab === "Draft Reply" && draftLoading && (
                  <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>•••</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Two column on desktop, tabs on mobile */}
      <div style={{
        display:             isMobile ? "block" : "grid",
        gridTemplateColumns: needsReply ? "1fr 1fr" : "1fr",
        gap:                 16,
      }}>

        {/* Email body — hidden on mobile when showing draft */}
        {(!isMobile || !showDraft) && (
          <div style={{
            background:   "#FFFFFF",
            border:       "1px solid #D4E3F0",
            borderRadius: 16,
            padding:      isMobile ? "16px" : "24px 28px",
            marginBottom: isMobile ? 0 : undefined,
          }}>
            <div style={{
              fontSize:      11,
              fontWeight:    500,
              color:         "#a8bdd1",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom:  14,
            }}>Original Email</div>

            {isHtml(email.body) ? (
              <iframe
                srcDoc={email.body}
                style={{
                  width:        "100%",
                  height:       isMobile ? 340 : 460,
                  border:       "none",
                  borderRadius: 8,
                  background:   "#fff",
                }}
                sandbox="allow-same-origin"
                title="Email content"
              />
            ) : (
              <div style={{
                fontSize:    isMobile ? 13 : 14,
                color:       "#3d5a80",
                lineHeight:  1.8,
                whiteSpace:  "pre-wrap",
                wordBreak:   "break-word",
                maxHeight:   isMobile ? 340 : 500,
                overflowY:   "auto",
              }}>
                {email.body || email.snippet || "(No content)"}
              </div>
            )}
          </div>
        )}

        {/* Draft reply — hidden on mobile when showing email */}
        {needsReply && (!isMobile || showDraft) && (
          <div style={{
            background:    "#FFFFFF",
            border:        "1px solid #D4E3F0",
            borderRadius:  16,
            padding:       isMobile ? "16px" : "24px 28px",
            display:       "flex",
            flexDirection: "column",
            gap:           14,
          }}>
            <div style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
            }}>
              <div style={{
                fontSize:      11,
                fontWeight:    500,
                color:         "#a8bdd1",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>AI Draft Reply</div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {draftLoading && (
                  <div style={{
                    display:    "flex",
                    alignItems: "center",
                    gap:        5,
                    fontSize:   11,
                    color:      "#578FCA",
                  }}>
                    <div style={{
                      width:          10,
                      height:         10,
                      borderRadius:   "50%",
                      border:         "2px solid #A1E3F9",
                      borderTopColor: "#3674B5",
                      animation:      "spin 0.8s linear infinite",
                    }}/>
                    Generating…
                  </div>
                )}
                {isEdited && !draftLoading && (
                  <span style={{
                    fontSize:  11,
                    color:     "#B55A1A",
                    background:"#FEF3E8",
                    border:    "1px solid #F8D5B4",
                    padding:   "2px 7px",
                    borderRadius: 20,
                  }}>Edited</span>
                )}
              </div>
            </div>

            {/* Textarea */}
            <div style={{ position: "relative", flex: 1 }}>
              <textarea
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                placeholder={draftLoading ? "" : "No draft generated"}
                style={{
                  width:      "100%",
                  minHeight:  isMobile ? 240 : 300,
                  background: draftLoading ? "#FAFCFF" : "#FFFFFF",
                  border:     "1px solid #D4E3F0",
                  borderRadius: 10,
                  padding:    "14px",
                  color:      "#1a2744",
                  fontSize:   isMobile ? 13 : 14,
                  lineHeight: 1.8,
                  fontFamily: "'Inter', sans-serif",
                  resize:     "vertical",
                  outline:    "none",
                  boxSizing:  "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#578FCA"}
                onBlur={e  => e.target.style.borderColor = "#D4E3F0"}
              />

              {draftLoading && draft === "" && (
                <div style={{
                  position:       "absolute",
                  inset:          0,
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  gap:            8,
                  color:          "#7a94b0",
                  fontSize:       13,
                  pointerEvents:  "none",
                }}>
                  <div style={{
                    width:          14,
                    height:         14,
                    borderRadius:   "50%",
                    border:         "2px solid #D4E3F0",
                    borderTopColor: "#3674B5",
                    animation:      "spin 0.8s linear infinite",
                  }}/>
                  Writing your reply…
                </div>
              )}
            </div>

            {error && (
              <div style={{
                fontSize:     12,
                color:        "#C0392B",
                background:   "#FDECEA",
                border:       "1px solid #F5C6C2",
                borderRadius: 8,
                padding:      "8px 12px",
              }}>{error}</div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || sent || !draft.trim() || draftLoading}
              style={{
                padding:        "11px 20px",
                background:     sent ? "#E8F8F2" : sending || draftLoading ? "#EBF3FB" : "#3674B5",
                border:         sent ? "1px solid #A8E6CC" : "none",
                borderRadius:   10,
                color:          sent ? "#1a9c6e" : sending || draftLoading ? "#7a94b0" : "#FFFFFF",
                fontSize:       14,
                fontWeight:     500,
                cursor:         sending || sent || draftLoading ? "not-allowed" : "pointer",
                fontFamily:     "'Inter', sans-serif",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                gap:            8,
                transition:     "all 0.2s",
              }}
            >
              {sent ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Sent — returning to inbox
                </>
              ) : sending ? "Sending…"
                : draftLoading ? "Generating…"
                : (
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
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}