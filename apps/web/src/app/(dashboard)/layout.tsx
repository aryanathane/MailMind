import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        padding: "24px 0",
        position: "fixed", top: 0, left: 0,
        height: "100vh", zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          padding: "0 20px 24px",
          borderBottom: "1px solid var(--border)",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              background: "var(--accent)",
              borderRadius: 8,
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 16,
            }}>✉</div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>MailMind</span>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {[
            { href: "/inbox", icon: "📥", label: "Inbox" },
            { href: "/stats", icon: "📊", label: "Stats" },
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8,
              color: "var(--text-muted)", textDecoration: "none",
              fontSize: 14, marginBottom: 2,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
              (e.currentTarget as HTMLElement).style.color = "var(--text)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}>
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div style={{
          padding: "16px 20px 0",
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{
            display: "flex", alignItems: "center",
            gap: 10, marginBottom: 12,
          }}>
            {session.user?.image && (
              <img
                src={session.user.image}
                alt="avatar"
                style={{ width: 32, height: 32, borderRadius: "50%" }}
              />
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {session.user?.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {session.user?.email}
              </div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 220, flex: 1, padding: "32px" }}>
        {children}
      </main>
    </div>
  );
}