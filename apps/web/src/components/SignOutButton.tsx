"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/signin" })}
      style={{
        width: "100%", padding: "8px 12px",
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: 8, color: "var(--text-muted)",
        fontSize: 13, cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
        (e.currentTarget as HTMLElement).style.color = "var(--text)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
      }}
    >
      Sign out
    </button>
  );
}