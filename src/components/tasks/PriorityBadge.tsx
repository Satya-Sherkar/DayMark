import { TaskPriority } from "../../types/task";

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const styles: Record<TaskPriority, { label: string; bg: string; text: string; border: string }> = {
    low: {
      label: "Low",
      bg: "bg-slate-100 dark:bg-slate-800/80",
      text: "text-slate-600 dark:text-slate-300",
      border: "border-slate-200 dark:border-slate-700",
    },
    medium: {
      label: "Medium",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-800/60",
    },
    high: {
      label: "High",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-800/60",
    },
    urgent: {
      label: "Urgent",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-200 dark:border-rose-800/60",
    },
  };

  const current = styles[priority];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border}`}
    >
      {current.label}
    </span>
  );
};
