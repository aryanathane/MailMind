import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/SidebarNav";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const name     = session.user?.name ?? "";
  const email    = session.user?.email ?? "";
  const image    = session.user?.image;
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F9" }}>

      {/* Sidebar — desktop only */}
      <aside style={{
        width:         240,
        flexShrink:    0,
        background:    "#FFFFFF",
        borderRight:   "1px solid #D4E3F0",
        display:       "flex",
        flexDirection: "column",
        position:      "fixed",
        top: 0, left: 0,
        height:        "100vh",
        zIndex:        10,
      }}
      className="desktop-sidebar"
      >
        {/* Logo */}
        <div style={{
          padding:      "20px 20px 16px",
          borderBottom: "1px solid #EBF2FA",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width:          34, height: 34,
              background:     "#3674B5",
              borderRadius:   8,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <span style={{ fontWeight: 600, fontSize: 16, color: "#1a2744" }}>
              MailMind
            </span>
          </div>
        </div>

        {/* Nav */}
        <SidebarNav />

        {/* User */}
        <div style={{
          padding:   "16px 20px",
          borderTop: "1px solid #EBF2FA",
        }}>
          <div style={{
            display:      "flex",
            alignItems:   "center",
            gap:          10,
            marginBottom: 12,
          }}>
            {image ? (
              <img
                src={image}
                alt={name}
                referrerPolicy="no-referrer"
                style={{
                  width:        36, height: 36,
                  borderRadius: "50%",
                  border:       "2px solid #D4E3F0",
                  objectFit:    "cover",
                }}
              />
            ) : (
              <div style={{
                width:          36, height: 36,
                borderRadius:   "50%",
                background:     "#EBF3FB",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       13, fontWeight: 600,
                color:          "#3674B5",
              }}>
                {initials}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize:     13, fontWeight: 500,
                color:        "#1a2744",
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
              }}>{name}</div>
              <div style={{
                fontSize:     11, color: "#7a94b0",
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
              }}>{email}</div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main" style={{ flex: 1, padding: "28px 32px" }}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <SidebarNav />

      <style>{`
        /* Desktop — show sidebar, full padding */
        @media (min-width: 768px) {
          .desktop-sidebar {
            display: flex !important;
          }
          .dashboard-main {
            margin-left: 240px !important;
            padding: 28px 32px !important;
          }
        }

        /* Mobile — hide sidebar, bottom padding for nav */
        @media (max-width: 767px) {
          .desktop-sidebar {
            display: none !important;
          }
          .dashboard-main {
            margin-left: 0 !important;
            padding: 16px 16px 80px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}