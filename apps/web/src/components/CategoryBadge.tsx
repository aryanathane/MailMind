import { type FC } from "react";
import type { EmailCategory } from "@mailmind/types";

interface Props { category: EmailCategory; size?: "sm" | "md"; }

const CONFIG: Record<EmailCategory, { label: string; color: string; bg: string; border: string }> = {
  urgent:      { label: "Urgent",      color: "#C0392B", bg: "#FDECEA", border: "#F5C6C2" },
  needs_reply: { label: "Needs Reply", color: "#B55A1A", bg: "#FEF3E8", border: "#F8D5B4" },
  fyi:         { label: "FYI",         color: "#1A5FA8", bg: "#EBF3FB", border: "#B8D4EF" },
  spam:        { label: "Spam",        color: "#5A7A8A", bg: "#F0F4F6", border: "#C8D8E0" },
};

const CategoryBadge: FC<Props> = ({ category, size = "sm" }) => {
  const { label, color, bg, border } = CONFIG[category] ?? CONFIG.fyi;
  return (
    <span style={{
      fontSize: size === "sm" ? 11 : 12,
      padding: size === "sm" ? "2px 8px" : "3px 10px",
      borderRadius: 20,
      background: bg, color, border: `1px solid ${border}`,
      fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {label}
    </span>
  );
};

export default CategoryBadge;