"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #EBF3FB 0%, #F0F4F9 50%, #E8F6F3 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          maxWidth: 1000,
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        {/* Left panel */}
        <div
          style={{
            flex: "1 1 320px",
            maxWidth: 460,
            minWidth: 280,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: "#3674B5",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1a2744",
                letterSpacing: "-0.3px",
              }}
            >
              MailMind
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(24px, 5vw, 38px)",
              fontWeight: 700,
              color: "#1a2744",
              letterSpacing: "-0.8px",
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Your inbox,
            <br />
            <span style={{ color: "#3674B5" }}>intelligently managed</span>
          </h1>

          <p
            style={{
              fontSize: 15,
              color: "#3d5a80",
              lineHeight: 1.7,
              marginBottom: 32,
            }}
          >
            MailMind uses AI to triage your emails, draft replies in your tone,
            and help you reach inbox zero.
          </p>

          {/* Features */}
          {[
            {
              icon: "⚡",
              title: "Smart triage",
              desc: "Every email categorized automatically",
            },
            {
              icon: "✍️",
              title: "AI reply drafts",
              desc: "Replies in your tone, ready to send",
            },
            {
              icon: "📊",
              title: "Inbox insights",
              desc: "Weekly stats on your email patterns",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 16,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "#EBF3FB",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                {icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1a2744",
                    marginBottom: 2,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{ fontSize: 13, color: "#7a94b0", lineHeight: 1.5 }}
                >
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right panel — sign in card */}
        <div
          style={{
            flex: "1 1 320px",
            maxWidth: 400,
            minWidth: 280,
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "40px 32px",
            boxShadow: "0 4px 32px rgba(54,116,181,0.10)",
            border: "1px solid #D4E3F0",
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#1a2744",
              marginBottom: 6,
            }}
          >
            Sign in
          </h2>

          <p
            style={{
              fontSize: 14,
              color: "#7a94b0",
              marginBottom: 28,
            }}
          >
            Connect your Gmail to get started
          </p>

          <button
            onClick={async () => {
              setLoading(true);
              await signIn("google", { callbackUrl: "/inbox" });
            }}
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 20px",
              background: "#FFFFFF",
              border: "1.5px solid #D4E3F0",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              color: "#1a2744",
              transition: "all 0.15s",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLElement).style.borderColor = "#578FCA";
                (e.currentTarget as HTMLElement).style.background = "#F7FBFF";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#D4E3F0";
              (e.currentTarget as HTMLElement).style.background = "#FFFFFF";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? "Connecting…" : "Continue with Google"}
          </button>

          <div style={{ height: 1, background: "#EBF2FA", margin: "24px 0" }} />

          {[
            "Gmail read & send access only",
            "Your data is never sold or shared",
            "Cancel access anytime from Google",
          ].map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
                fontSize: 12,
                color: "#7a94b0",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3674B5"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
