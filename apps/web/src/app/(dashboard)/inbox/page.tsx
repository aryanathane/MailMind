"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { ParsedEmail, EmailCategory } from "@mailmind/types";
import CategoryBadge from "@/components/CategoryBadge";
import Link from "next/link";

const FILTERS: { label: string; value: EmailCategory | "all" }[] = [
  { label: "All",         value: "all" },
  { label: "Urgent",      value: "urgent" },
  { label: "Needs Reply", value: "needs_reply" },
  { label: "FYI",         value: "fyi" },
  { label: "Spam",        value: "spam" },
];

const LIMIT = 20;

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function extractName(from: string): string {
  const match = from.match(/^([^<]+)/);
  return match ? match[1].trim() : from;
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

function getInitials(name: string): string {
  return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(email: string): string {
  const colors = ["#3674B5","#578FCA","#2e86ab","#1a6b4a","#7b5ea7","#c06014","#a63d2f"];
  return colors[email.charCodeAt(0) % colors.length];
}

// Deduplicate emails by ID
function deduplicateEmails(emails: ParsedEmail[]): ParsedEmail[] {
  const seen = new Set<string>();
  return emails.filter((email) => {
    if (seen.has(email.id)) return false;
    seen.add(email.id);
    return true;
  });
}

export default function InboxPage() {
  const [emails,      setEmails]      = useState<ParsedEmail[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [syncing,     setSyncing]     = useState(false);
  const [filter,      setFilter]      = useState<EmailCategory | "all">("all");
  const [triaging,    setTriaging]    = useState<Set<string>>(new Set());
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [total,       setTotal]       = useState(0);
  const loaderRef                     = useRef<HTMLDivElement>(null);

  const fetchEmails = useCallback(async (
    pageNum: number,
    refresh = false,
    append  = false
  ) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const url  = `/api/emails?page=${pageNum}&limit=${LIMIT}${refresh ? "&refresh=true" : ""}`;
      const res  = await fetch(url);
      const json = await res.json();

      if (json.data) {
        const { emails: newEmails, hasMore: more, total: t, syncing: s } = json.data;
        setEmails((prev) => {
          const combined = append ? [...prev, ...newEmails] : newEmails;
          return deduplicateEmails(combined);
        });
        setHasMore(more);
        setTotal(t);
        setPage(pageNum);
        setSyncing(s ?? false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchEmails(1); }, []);

  useEffect(() => {
    const untriaged = emails
      .filter((e) => !e.triageResult && !triaging.has(e.id))
      .slice(0, 5);

    if (untriaged.length === 0) return;

    untriaged.forEach((email) => {
      setTriaging((prev) => new Set(prev).add(email.id));
      fetch(`/api/emails/${email.id}/triage`, { method: "POST" })
        .then((r) => r.json())
        .then((res) => {
          if (res.data) {
            setEmails((prev) =>
              prev.map((e) =>
                e.id === email.id ? { ...e, triageResult: res.data } : e
              )
            );
          }
        });
    });
  }, [emails]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchEmails(page + 1, false, true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchEmails]);

  const filtered = filter === "all"
    ? emails
    : emails.filter((e) => e.triageResult?.category === filter);

  const counts = {
    urgent:      emails.filter(e => e.triageResult?.category === "urgent").length,
    needs_reply: emails.filter(e => e.triageResult?.category === "needs_reply").length,
    fyi:         emails.filter(e => e.triageResult?.category === "fyi").length,
    spam:        emails.filter(e => e.triageResult?.category === "spam").length,
  };

  return (
    <div style={{ maxWidth: 800 }}>

      {/* Header */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        marginBottom:   20,
      }}>
        <div>
          <h1 style={{
            fontSize:      20,
            fontWeight:    600,
            color:         "#1a2744",
            letterSpacing: "-0.2px",
          }}>Inbox</h1>
          <p style={{ color: "#7a94b0", fontSize: 12, marginTop: 2 }}>
            {total} emails · {emails.filter(e => e.triageResult).length} triaged
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {syncing && (
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
              Syncing…
            </div>
          )}
          <button
            onClick={() => fetchEmails(1, true)}
            style={{
              padding:      "8px 14px",
              background:   "#FFFFFF",
              border:       "1px solid #D4E3F0",
              borderRadius: 8,
              color:        "#3d5a80",
              fontSize:     13,
              cursor:       "pointer",
              fontFamily:   "'Inter', sans-serif",
              display:      "flex",
              alignItems:   "center",
              gap:          6,
              transition:   "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#578FCA";
              (e.currentTarget as HTMLElement).style.color = "#3674B5";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#D4E3F0";
              (e.currentTarget as HTMLElement).style.color = "#3d5a80";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display:                 "flex",
        gap:                     4,
        marginBottom:            16,
        overflowX:               "auto",
        paddingBottom:           4,
        WebkitOverflowScrolling: "touch" as any,
        scrollbarWidth:          "none" as any,
      }}>
        {FILTERS.map(({ label, value }) => {
          const count = value !== "all" ? counts[value] : emails.length;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              style={{
                padding:      "6px 12px",
                borderRadius: 20,
                border:       "1.5px solid",
                borderColor:  filter === value ? "#3674B5" : "#D4E3F0",
                background:   filter === value ? "#3674B5" : "#FFFFFF",
                color:        filter === value ? "#FFFFFF" : "#3d5a80",
                fontSize:     12,
                fontWeight:   filter === value ? 500 : 400,
                cursor:       "pointer",
                fontFamily:   "'Inter', sans-serif",
                whiteSpace:   "nowrap",
                flexShrink:   0,
                display:      "flex",
                alignItems:   "center",
                gap:          5,
                transition:   "all 0.15s",
              }}
            >
              {label}
              {count > 0 && (
                <span style={{
                  fontSize:     10,
                  background:   filter === value ? "rgba(255,255,255,0.25)" : "#EBF3FB",
                  color:        filter === value ? "#fff" : "#3674B5",
                  padding:      "1px 5px",
                  borderRadius: 10,
                  fontWeight:   500,
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Email list */}
      <div style={{
        background:   "#FFFFFF",
        border:       "1px solid #D4E3F0",
        borderRadius: 12,
        overflow:     "hidden",
      }}>
        {loading ? (
          <div>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                padding:      "14px 20px",
                borderBottom: "1px solid #EBF2FA",
                display:      "flex",
                gap:          12,
                alignItems:   "center",
              }}>
                <div style={{
                  width:        38,
                  height:       38,
                  borderRadius: "50%",
                  background:   "#EBF2FA",
                  flexShrink:   0,
                }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, background: "#EBF2FA", borderRadius: 4, width: "35%", marginBottom: 8 }}/>
                  <div style={{ height: 12, background: "#EBF2FA", borderRadius: 4, width: "65%", marginBottom: 6 }}/>
                  <div style={{ height: 10, background: "#EBF2FA", borderRadius: 4, width: "50%" }}/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding:   "60px 0",
            color:     "#7a94b0",
            fontSize:  14,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            No emails in this category
          </div>
        ) : (
          <>
            {filtered.map((email, idx) => (
              <Link
                key={`email-${email.id}`}
                href={`/inbox/${email.id}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  style={{
                    padding:      "14px 20px",
                    borderBottom: idx < filtered.length - 1 ? "1px solid #EBF2FA" : "none",
                    display:      "flex",
                    gap:          14,
                    alignItems:   "flex-start",
                    background:   "#FFFFFF",
                    cursor:       "pointer",
                    transition:   "background 0.1s",
                  }}
                  onMouseEnter={e =>
                    (e.currentTarget as HTMLElement).style.background = "#F7FBFF"
                  }
                  onMouseLeave={e =>
                    (e.currentTarget as HTMLElement).style.background = "#FFFFFF"
                  }
                >
                  {/* Avatar */}
                  <div style={{
                    width:          38,
                    height:         38,
                    borderRadius:   "50%",
                    background:     avatarColor(extractEmail(email.from)),
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    fontSize:       13,
                    color:          "#FFFFFF",
                    fontWeight:     600,
                    flexShrink:     0,
                  }}>
                    {getInitials(extractName(email.from))}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "space-between",
                      marginBottom:   3,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize:   13,
                          fontWeight: 500,
                          color:      "#1a2744",
                        }}>
                          {extractName(email.from)}
                        </span>
                        {email.triageResult ? (
                          <CategoryBadge category={email.triageResult.category} />
                        ) : (
                          <span style={{
                            fontSize:     10,
                            color:        "#a8bdd1",
                            padding:      "2px 7px",
                            border:       "1px solid #D4E3F0",
                            borderRadius: 20,
                          }}>analyzing…</span>
                        )}
                      </div>
                      <span style={{
                        fontSize:  12,
                        color:     "#a8bdd1",
                        flexShrink: 0,
                      }}>
                        {timeAgo(email.date)}
                      </span>
                    </div>

                    <div style={{
                      fontSize:     13,
                      fontWeight:   500,
                      color:        "#1a2744",
                      marginBottom: 3,
                      overflow:     "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace:   "nowrap",
                    }}>{email.subject}</div>

                    <div style={{
                      fontSize:     12,
                      color:        "#7a94b0",
                      overflow:     "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace:   "nowrap",
                    }}>
                      {email.triageResult?.summary ?? email.snippet}
                    </div>
                  </div>

                  {/* Priority dot */}
                  {(email.triageResult?.priority ?? 99) <= 2 && (
                    <div style={{
                      width:        7,
                      height:       7,
                      borderRadius: "50%",
                      background:   "#DC3545",
                      flexShrink:   0,
                      marginTop:    6,
                    }}/>
                  )}
                </div>
              </Link>
            ))}

            {/* Infinite scroll trigger */}
            <div ref={loaderRef} style={{ padding: "14px 0", textAlign: "center" }}>
              {loadingMore ? (
                <div style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  gap:            8,
                  color:          "#7a94b0",
                  fontSize:       13,
                }}>
                  <div style={{
                    width:          16,
                    height:         16,
                    borderRadius:   "50%",
                    border:         "2px solid #D4E3F0",
                    borderTopColor: "#3674B5",
                    animation:      "spin 0.8s linear infinite",
                  }}/>
                  Loading more…
                </div>
              ) : !hasMore && emails.length > 0 ? (
                <div style={{ color: "#a8bdd1", fontSize: 12 }}>
                  All {total} emails loaded
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}