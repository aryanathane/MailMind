"use client";

import { useEffect, useState } from "react";
import type { StatsData } from "@/app/api/stats/route";
import { useIsMobile } from "@/hooks/useIsMobile";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  urgent:      { label: "Urgent",      color: "#C0392B", bg: "#FDECEA" },
  needs_reply: { label: "Needs Reply", color: "#B55A1A", bg: "#FEF3E8" },
  fyi:         { label: "FYI",         color: "#1A5FA8", bg: "#EBF3FB" },
  spam:        { label: "Spam",        color: "#5A7A8A", bg: "#F0F4F6" },
};

function StatCard({ label, value, sub, accent = "#3674B5", isMobile = false }: {
  label:    string;
  value:    string | number;
  sub?:     string;
  accent?:  string;
  isMobile?: boolean;
}) {
  return (
    <div style={{
      background:   "#FFFFFF",
      border:       "1px solid #D4E3F0",
      borderRadius: 12,
      padding:      isMobile ? "16px" : "20px 24px",
    }}>
      <div style={{
        fontSize:      11,
        fontWeight:    500,
        color:         "#a8bdd1",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom:  8,
      }}>{label}</div>
      <div style={{
        fontSize:      isMobile ? 28 : 32,
        fontWeight:    600,
        color:         accent,
        letterSpacing: "-1px",
        marginBottom:  4,
      }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 12, color: "#7a94b0" }}>{sub}</div>
      )}
    </div>
  );
}

export default function StatsPage() {
  const isMobile              = useIsMobile();
  const [stats,   setStats]   = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((res) => setStats(res.data ?? null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ height: 22, background: "#EBF2FA", borderRadius: 4, width: 80, marginBottom: 8 }}/>
        <div style={{ height: 13, background: "#EBF2FA", borderRadius: 4, width: 200 }}/>
      </div>
      <div style={{
        display:             "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap:                 10, marginBottom: 12,
      }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            background: "#FFFFFF", border: "1px solid #D4E3F0",
            borderRadius: 12, padding: "20px",
          }}>
            <div style={{ height: 10, background: "#EBF2FA", borderRadius: 4, width: "60%", marginBottom: 12 }}/>
            <div style={{ height: 28, background: "#EBF2FA", borderRadius: 4, width: "40%" }}/>
          </div>
        ))}
      </div>
    </div>
  );

  if (!stats) return (
    <div style={{
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      height:         "60vh",
      color:          "#7a94b0",
      fontSize:       14,
    }}>No stats available yet.</div>
  );

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Header */}
      <div style={{ marginBottom: isMobile ? 20 : 28 }}>
        <h1 style={{
          fontSize:      isMobile ? 18 : 20,
          fontWeight:    600,
          color:         "#1a2744",
          letterSpacing: "-0.2px",
        }}>Stats</h1>
        <p style={{ color: "#7a94b0", fontSize: 13, marginTop: 2 }}>
          Your MailMind activity at a glance
        </p>
      </div>

      {/* Stat cards — 2 col on mobile, 4 col on desktop */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap:                 10,
        marginBottom:        12,
      }}>
        <StatCard
          label="Total Emails"
          value={stats.total}
          sub="fetched from Gmail"
          accent="#3674B5"
          isMobile={isMobile}
        />
        <StatCard
          label="Triaged"
          value={stats.triaged}
          sub={`${stats.total > 0 ? Math.round((stats.triaged / stats.total) * 100) : 0}% of inbox`}
          accent="#578FCA"
          isMobile={isMobile}
        />
        <StatCard
          label="Replied"
          value={stats.replied}
          sub="sent via MailMind"
          accent="#1a9c6e"
          isMobile={isMobile}
        />
        <StatCard
          label="Reply Rate"
          value={`${Math.round(stats.replyRate * 100)}%`}
          sub="of triaged emails"
          accent="#E07B39"
          isMobile={isMobile}
        />
      </div>

      {/* Bottom row — stack on mobile */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap:                 12,
      }}>

        {/* Category breakdown */}
        <div style={{
          background:   "#FFFFFF",
          border:       "1px solid #D4E3F0",
          borderRadius: 12,
          padding:      isMobile ? "16px" : "20px 24px",
        }}>
          <div style={{
            fontSize:      11,
            fontWeight:    500,
            color:         "#a8bdd1",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom:  16,
          }}>Category Breakdown</div>

          {Object.keys(stats.byCategory).length === 0 ? (
            <div style={{ color: "#a8bdd1", fontSize: 13 }}>
              No triaged emails yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Object.entries(stats.byCategory).map(([cat, count]) => {
                const config = CATEGORY_CONFIG[cat];
                const pct    = stats.triaged > 0
                  ? (count / stats.triaged) * 100
                  : 0;
                return (
                  <div key={cat}>
                    <div style={{
                      display:        "flex",
                      justifyContent: "space-between",
                      marginBottom:   6,
                    }}>
                      <span style={{
                        fontSize:   13,
                        color:      config?.color ?? "#1a2744",
                        fontWeight: 500,
                      }}>
                        {config?.label ?? cat}
                      </span>
                      <span style={{ fontSize: 13, color: "#7a94b0" }}>
                        {count} · {Math.round(pct)}%
                      </span>
                    </div>
                    <div style={{
                      height:       6,
                      borderRadius: 3,
                      background:   "#EBF2FA",
                      overflow:     "hidden",
                    }}>
                      <div style={{
                        height:       "100%",
                        borderRadius: 3,
                        width:        `${pct}%`,
                        background:   config?.color ?? "#3674B5",
                        transition:   "width 0.6s ease",
                      }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI quality */}
        <div style={{
          background:   "#FFFFFF",
          border:       "1px solid #D4E3F0",
          borderRadius: 12,
          padding:      isMobile ? "16px" : "20px 24px",
        }}>
          <div style={{
            fontSize:      11,
            fontWeight:    500,
            color:         "#a8bdd1",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom:  16,
          }}>AI Draft Quality</div>

          <div style={{ marginBottom: 16 }}>
            <div style={{
              display:        "flex",
              justifyContent: "space-between",
              marginBottom:   8,
            }}>
              <span style={{ fontSize: 13, color: "#3d5a80" }}>
                Sent without editing
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#1a9c6e" }}>
                {Math.round(100 - stats.editRate * 100)}%
              </span>
            </div>
            <div style={{
              height:       8,
              borderRadius: 4,
              background:   "#EBF2FA",
              overflow:     "hidden",
            }}>
              <div style={{
                height:       "100%",
                borderRadius: 4,
                width:        `${100 - stats.editRate * 100}%`,
                background:   "linear-gradient(90deg, #3674B5, #A1E3F9)",
                transition:   "width 0.6s ease",
              }}/>
            </div>
            <div style={{ fontSize: 12, color: "#a8bdd1", marginTop: 6 }}>
              Higher = AI drafts match your tone better
            </div>
          </div>

          <div style={{
            background:   "#EBF3FB",
            border:       "1px solid #C5DCF2",
            borderRadius: 10,
            padding:      "12px 14px",
          }}>
            <div style={{
              fontSize:   isMobile ? 12 : 13,
              color:      "#1A5FA8",
              lineHeight: 1.7,
            }}>
              MailMind has processed{" "}
              <strong>{stats.triaged}</strong> emails and helped you reply to{" "}
              <strong>{stats.replied}</strong>.
              {stats.editRate < 0.3 && stats.replied > 0 &&
                " AI is nailing your tone. 🎯"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}