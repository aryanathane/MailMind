"use client";

import { useEffect, useState } from "react";
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

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const diff = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function extractName(from: string): string {
  const match = from.match(/^([^<]+)/);
  return match ? match[1].trim() : from;
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

export default function InboxPage() {
  const [emails,   setEmails]   = useState<ParsedEmail[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<EmailCategory | "all">("all");
  const [triaging, setTriaging] = useState<Set<string>>(new Set());

  // Fetch emails on mount
  useEffect(() => {
    fetch("/api/emails")
      .then((r) => r.json())
      .then((res) => setEmails(res.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Auto-triage emails that haven't been triaged yet
  useEffect(() => {
    emails.forEach((email) => {
      if (!email.triageResult && !triaging.has(email.id)) {
        setTriaging((prev) => new Set(prev).add(email.id));

        fetch(`/api/emails/${email.id}/triage`, { method: "POST" })
          .then((r) => r.json())
          .then((res) => {
            if (res.data) {
              setEmails((prev) =>
                prev.map((e) =>
                  e.id === email.id
                    ? { ...e, triageResult: res.data }
                    : e
                )
              );
            }
          });
      }
    });
  }, [emails]);

  const filtered = filter === "all"
    ? emails
    : emails.filter((e) => e.triageResult?.category === filter);

  return (
    <div style={{ maxWidth: 760 }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 28,
      }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 600,
            color: "#f0f0ff", letterSpacing: "-0.3px",
          }}>Inbox</h1>
          <p style={{ color: "#6b6b8a", fontSize: 13, marginTop: 4 }}>
            {emails.length} emails · {emails.filter(e => e.triageResult).length} triaged
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => {
            setLoading(true);
            fetch("/api/emails")
              .then((r) => r.json())
              .then((res) => setEmails(res.data ?? []))
              .finally(() => setLoading(false));
          }}
          style={{
            padding: "8px 16px",
            background: "#ffffff08",
            border: "1px solid #1e1e35",
            borderRadius: 8, color: "#9090b8",
            fontSize: 13, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "#ffffff12";
            (e.currentTarget as HTMLElement).style.color = "#e2e2f0";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "#ffffff08";
            (e.currentTarget as HTMLElement).style.color = "#9090b8";
          }}
        >↻ Refresh</button>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: "flex", gap: 6,
        marginBottom: 20, flexWrap: "wrap",
      }}>
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: filter === value
                ? "1px solid #6366f1"
                : "1px solid #1e1e35",
              background: filter === value
                ? "#6366f120"
                : "transparent",
              color: filter === value ? "#818cf8" : "#6b6b8a",
              fontSize: 12, fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}
          >{label}</button>
        ))}
      </div>

      {/* Email list */}
      {loading ? (
        // Skeleton loader
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              height: 80,
              background: "linear-gradient(90deg, #0f0f1a, #16162a, #0f0f1a)",
              borderRadius: 12, border: "1px solid #1e1e35",
              animation: "pulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.1}s`,
            }}/>
          ))}
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.4; }
            }
          `}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 0",
          color: "#45455a", fontSize: 14,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          No emails in this category
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((email) => (
            <Link
              key={email.id}
              href={`/inbox/${email.id}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{
                background: "#0f0f1a",
                border: "1px solid #1e1e35",
                borderRadius: 12,
                padding: "16px 20px",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "#16162a";
                (e.currentTarget as HTMLElement).style.borderColor = "#2e2e4e";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "#0f0f1a";
                (e.currentTarget as HTMLElement).style.borderColor = "#1e1e35";
              }}>
                {/* Left side */}
                <div style={{ minWidth: 0 }}>
                  {/* Sender + badge */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: 8, marginBottom: 4,
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: `hsl(${extractEmail(email.from).charCodeAt(0) * 7 % 360}, 40%, 25%)`,
                      display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11,
                      color: "#e2e2f0", fontWeight: 500,
                      flexShrink: 0,
                    }}>
                      {extractName(email.from).charAt(0).toUpperCase()}
                    </div>

                    <span style={{
                      fontSize: 13, fontWeight: 500,
                      color: "#c0c0d8",
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {extractName(email.from)}
                    </span>

                    {email.triageResult ? (
                      <CategoryBadge category={email.triageResult.category} />
                    ) : (
                      <span style={{
                        fontSize: 10, color: "#45455a",
                        padding: "2px 8px",
                        border: "1px solid #1e1e35",
                        borderRadius: 20,
                      }}>analyzing…</span>
                    )}
                  </div>

                  {/* Subject */}
                  <div style={{
                    fontSize: 14, fontWeight: 500,
                    color: "#e2e2f0", marginBottom: 4,
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>{email.subject}</div>

                  {/* AI summary or snippet */}
                  <div style={{
                    fontSize: 12, color: "#6b6b8a",
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {email.triageResult?.summary ?? email.snippet}
                  </div>
                </div>

                {/* Right side — time + priority */}
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "flex-end", gap: 6,
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 11, color: "#45455a" }}>
                    {timeAgo(email.date)}
                  </span>
                  {email.triageResult && (
                    <span style={{
                      fontSize: 10,
                      color: email.triageResult.priority <= 2
                        ? "#f87171"
                        : "#45455a",
                    }}>
                      P{email.triageResult.priority}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}