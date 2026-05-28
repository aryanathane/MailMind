"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href:  "/inbox",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
        <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
      </svg>
    ),
    label: "Inbox",
  },
  {
    href:  "/stats",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
      </svg>
    ),
    label: "Stats",
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar nav */}
      <nav className="sidebar-nav">
        {links.map(({ href, icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display:        "flex",
                alignItems:     "center",
                gap:            10,
                padding:        "9px 12px",
                borderRadius:   8,
                color:          active ? "#3674B5" : "#3d5a80",
                background:     active ? "#EBF3FB" : "transparent",
                textDecoration: "none",
                fontSize:       14,
                fontWeight:     active ? 500 : 400,
                marginBottom:   4,
                transition:     "all 0.15s",
              }}
            >
              {icon}
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {links.map(({ href, icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                justifyContent: "center",
                gap:            3,
                padding:        "8px 32px",
                borderRadius:   10,
                color:          active ? "#3674B5" : "#7a94b0",
                textDecoration: "none",
                fontSize:       11,
                fontWeight:     active ? 600 : 400,
                background:     active ? "#EBF3FB" : "transparent",
                transition:     "all 0.15s",
              }}
            >
              {icon}
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        .sidebar-nav {
          flex: 1;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
        }
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: #FFFFFF;
          border-top: 1px solid #D4E3F0;
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: 100;
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Desktop */
        @media (min-width: 768px) {
          .sidebar-nav { display: flex !important; }
          .bottom-nav  { display: none  !important; }
        }

        /* Mobile */
        @media (max-width: 767px) {
          .sidebar-nav { display: none  !important; }
          .bottom-nav  { display: flex  !important; }
        }
      `}</style>
    </>
  );
}