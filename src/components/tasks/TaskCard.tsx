import React from "react";
import { Calendar, Check, Clock, Edit2, Trash2, Repeat } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { Task } from "../../types/task";
import { Project } from "../../types/project";
import { Category } from "../../types/category";
import { PriorityBadge } from "./PriorityBadge";
import { ProjectBadge } from "./ProjectBadge";
import { CategoryBadge } from "./CategoryBadge";

interface TaskCardProps {
  task: Task;
  project?: Project | null;
  category?: Category | null;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  project,
  category,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const isCompleted = task.status === "completed";

  let formattedDue: string | null = null;
  let isOverdue = false;

  if (task.dueAt) {
    try {
      const parsed = parseISO(task.dueAt);
      formattedDue = format(parsed, "MMM d, yyyy HH:mm");
      isOverdue = !isCompleted && isPast(parsed);
    } catch {
      formattedDue = task.dueAt;
    }
  }

  return (
    <div
      className={`group flex items-start justify-between p-3.5 rounded-[6px] border transition-colors ${
        isCompleted
          ? "bg-dm-surface/50 border-dm-border opacity-65"
          : "bg-dm-surface border-dm-border hover:border-dm-border-hover"
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
        {/* Editorial Checkbox */}
        <button
          onClick={() => onToggleComplete(task)}
          className={`mt-0.5 w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors cursor-pointer shrink-0 focus:outline-none focus:ring-1 focus:ring-dm-accent ${
            isCompleted
              ? "bg-dm-accent border-dm-accent text-white"
              : "border-dm-border bg-dm-bg hover:border-dm-accent"
          }`}
          title={isCompleted ? "Mark as pending" : "Mark as completed"}
        >
          {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-xs sm:text-sm font-sans font-medium truncate ${
                isCompleted
                  ? "line-through text-dm-text-secondary"
                  : "text-dm-text-primary"
              }`}
            >
              {task.title}
            </h3>
            <PriorityBadge priority={task.priority} />
          </div>

          {task.description && (
            <p className="mt-1 text-xs font-sans text-dm-text-secondary line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="mt-2 flex items-center flex-wrap gap-2 text-xs">
            {formattedDue && (
              <span
                className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                  isOverdue
                    ? "text-dm-accent font-semibold"
                    : "text-dm-text-secondary"
                }`}
              >
                {isOverdue ? <Clock className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                <span>{formattedDue}</span>
                {isOverdue && <span className="uppercase text-[9px] tracking-wider">(Overdue)</span>}
              </span>
            )}
            {project && <ProjectBadge project={project} />}
            {category && <CategoryBadge category={category} />}
            {task.recurrenceRule && (
              <span
                className="inline-flex items-center gap-1 font-mono text-[10px] text-dm-text-secondary bg-dm-surface-hover px-1.5 py-0.5 rounded-[4px] border border-dm-border"
                title={`Repeats ${task.recurrenceRule}`}
              >
                <Repeat className="w-2.5 h-2.5 text-dm-accent" />
                <span className="capitalize">{task.recurrenceRule}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="p-1 rounded-[4px] text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-bg border border-transparent hover:border-dm-border transition-colors cursor-pointer"
          title="Edit Task"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 rounded-[4px] text-dm-text-secondary hover:text-dm-accent hover:bg-dm-bg border border-transparent hover:border-dm-border transition-colors cursor-pointer"
          title="Delete Task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
