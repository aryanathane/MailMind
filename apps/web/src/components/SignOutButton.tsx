"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/signin" })}
      style={{
        width: "100%", padding: "8px 12px",
        background: "transparent",
        border: "1px solid #D4E3F0",
        borderRadius: 8, color: "#7a94b0",
        fontSize: 13, cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "#EBF3FB";
        (e.currentTarget as HTMLElement).style.color = "#3674B5";
        (e.currentTarget as HTMLElement).style.borderColor = "#A1E3F9";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = "#7a94b0";
        (e.currentTarget as HTMLElement).style.borderColor = "#D4E3F0";
      }}
    >
      Sign out
    </button>
  );
}