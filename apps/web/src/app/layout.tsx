import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: "MailMind",
  description: "AI-powered email assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#080810", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}