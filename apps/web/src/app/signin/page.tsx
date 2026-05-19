"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/inbox" });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080810",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: `linear-gradient(#1e1e3520 1px, transparent 1px),
                          linear-gradient(90deg, #1e1e3520 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }}/>

      {/* Purple glow top */}
      <div style={{
        position: "fixed",
        top: "-100px", left: "50%",
        transform: "translateX(-50%)",
        width: 700, height: 400,
        background: "radial-gradient(ellipse, #6366f122 0%, transparent 70%)",
        pointerEvents: "none",
      }}/>

      {/* Bottom glow */}
      <div style={{
        position: "fixed",
        bottom: "-100px", left: "50%",
        transform: "translateX(-50%)",
        width: 500, height: 300,
        background: "radial-gradient(ellipse, #818cf810 0%, transparent 70%)",
        pointerEvents: "none",
      }}/>

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 1,
        background: "linear-gradient(160deg, #0f0f1e 0%, #0a0a15 100%)",
        border: "1px solid #1e1e35",
        borderRadius: 20,
        padding: "52px 44px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 0 0 1px #6366f110, 0 32px 64px #00000060",
      }}>

        {/* Logo mark */}
        <div style={{
          width: 52, height: 52,
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          borderRadius: 14,
          display: "flex", alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 28px",
          boxShadow: "0 8px 24px #6366f140",
          fontSize: 24,
        }}>✦</div>

        {/* Heading */}
        <h1 style={{
          fontSize: 32, fontWeight: 600,
          color: "#f0f0ff",
          textAlign: "center",
          letterSpacing: "-0.5px",
          marginBottom: 10,
        }}>MailMind</h1>

        <p style={{
          color: "#6b6b8a",
          fontSize: 15,
          textAlign: "center",
          lineHeight: 1.7,
          marginBottom: 36,
        }}>
          Your inbox, finally under control.<br/>
          <span style={{ color: "#9090b0", fontSize: 13 }}>
            AI triage · Smart drafts · Zero anxiety
          </span>
        </p>

        {/* Features */}
        <div style={{
          background: "#ffffff05",
          border: "1px solid #1e1e35",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 28,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          {[
            { icon: "⚡", text: "Instant email categorization" },
            { icon: "✍️", text: "AI reply drafts in your tone" },
            { icon: "📊", text: "Weekly productivity insights" },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: "flex", alignItems: "center", gap: 12,
              color: "#9090b8", fontSize: 13,
            }}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Google button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px 20px",
            background: loading
              ? "#16162a"
              : "linear-gradient(135deg, #ffffff, #f0f0ff)",
            color: "#08080f",
            border: "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "all 0.2s",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.1px",
            boxShadow: loading ? "none" : "0 4px 16px #ffffff20",
          }}
          onMouseEnter={e => {
            if (!loading) {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px #ffffff30";
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px #ffffff20";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Connecting..." : "Continue with Google"}
        </button>

        {/* Divider */}
        <div style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, #1e1e35, transparent)",
          margin: "24px 0",
        }}/>

        {/* Footer note */}
        <p style={{
          color: "#45455a",
          fontSize: 11,
          textAlign: "center",
          lineHeight: 1.7,
        }}>
          We request Gmail read & send access only.<br/>
          Your data stays private. No ads. Ever.
        </p>
      </div>
    </div>
  );
}