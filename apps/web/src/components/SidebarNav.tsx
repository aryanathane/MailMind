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
    <nav style={{ flex: 1, padding: "8px 12px" }}>
      {links.map(({ href, icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8,
            color: active ? "#3674B5" : "#3d5a80",
            background: active ? "#EBF3FB" : "transparent",
            textDecoration: "none",
            fontSize: 14, fontWeight: active ? 500 : 400,
            marginBottom: 2, transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}