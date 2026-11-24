import React from "react";
import { TaskPriority } from "../../types/task";

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = "" }) => {
  const styles: Record<TaskPriority, { label: string; className: string }> = {
    low: {
      label: "Low",
      className: "text-dm-text-secondary border-dm-border bg-dm-surface",
    },
    medium: {
      label: "Medium",
      className: "text-dm-text-primary border-dm-border bg-dm-surface",
    },
    high: {
      label: "High",
      className: "text-[#B36B42] dark:text-[#D17B54] border-[#B36B42]/30 dark:border-[#D17B54]/30 bg-[#B36B42]/10",
    },
    urgent: {
      label: "Urgent",
      className: "text-dm-accent border-dm-accent/40 bg-dm-accent/10 font-semibold",
    },
  };

  const current = styles[priority];

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono tracking-wider uppercase border ${current.className} ${className}`}
    >
      {current.label}
    </span>
  );
};
