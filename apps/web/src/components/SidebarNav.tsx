"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/inbox", icon: "📥", label: "Inbox" },
  { href: "/stats", icon: "📊", label: "Stats" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, padding: "0 12px" }}>
      {links.map(({ href, icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8,
              color: active ? "#e2e2f0" : "#6b6b8a",
              background: active ? "#ffffff0a" : "transparent",
              textDecoration: "none",
              fontSize: 14, marginBottom: 2,
              transition: "all 0.15s",
              borderLeft: active ? "2px solid #6366f1" : "2px solid transparent",
            }}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}