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
  if (!session) redirect("/signin");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: "#0f0f1a",
        borderRight: "1px solid #1e1e35",
        display: "flex", flexDirection: "column",
        padding: "24px 0",
        position: "fixed", top: 0, left: 0,
        height: "100vh", zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          padding: "0 20px 24px",
          borderBottom: "1px solid #1e1e35",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              borderRadius: 8,
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 16,
            }}>✦</div>
            <span style={{ fontWeight: 600, fontSize: 15, color: "#f0f0ff" }}>
              MailMind
            </span>
          </div>
        </div>

        {/* Nav — client component */}
        <SidebarNav />

        {/* User info */}
        <div style={{
          padding: "16px 20px 0",
          borderTop: "1px solid #1e1e35",
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
              <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e2f0" }}>
                {session.user?.name}
              </div>
              <div style={{ fontSize: 11, color: "#6b6b8a" }}>
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