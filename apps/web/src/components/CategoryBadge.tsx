import { type FC } from "react";
import type { EmailCategory } from "@mailmind/types";

interface Props {
  category: EmailCategory;
  size?: "sm" | "md";
}

const CONFIG: Record<EmailCategory, { label: string; color: string; bg: string; border: string }> = {
  urgent:      { label: "Urgent",       color: "#f87171", bg: "#f8717115", border: "#f8717130" },
  needs_reply: { label: "Needs Reply",  color: "#fb923c", bg: "#fb923c15", border: "#fb923c30" },
  fyi:         { label: "FYI",          color: "#60a5fa", bg: "#60a5fa15", border: "#60a5fa30" },
  spam:        { label: "Spam",         color: "#6b7280", bg: "#6b728015", border: "#6b728030" },
};

const CategoryBadge: FC<Props> = ({ category, size = "sm" }) => {
  const { label, color, bg, border } = CONFIG[category] ?? CONFIG.fyi;
  return (
    <span style={{
      fontSize: size === "sm" ? 10 : 12,
      padding: size === "sm" ? "2px 8px" : "3px 10px",
      borderRadius: 20,
      background: bg,
      color,
      border: `1px solid ${border}`,
      fontWeight: 500,
      whiteSpace: "nowrap",
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
};

export default CategoryBadge;