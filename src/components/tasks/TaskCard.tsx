import { Calendar, CheckCircle2, Circle, Clock, Edit2, Trash2 } from "lucide-react";
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
      formattedDue = format(parsed, "MMM d, yyyy h:mm a");
      isOverdue = !isCompleted && isPast(parsed);
    } catch {
      formattedDue = task.dueAt;
    }
  }

  return (
    <div
      className={`group flex items-start justify-between p-4 rounded-xl border transition-all duration-150 ${
        isCompleted
          ? "bg-slate-50/50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800/60 opacity-75"
          : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs"
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
        <button
          onClick={() => onToggleComplete(task)}
          className="mt-0.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-hidden"
          title={isCompleted ? "Mark as pending" : "Mark as completed"}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-50 dark:fill-emerald-950" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`text-sm font-semibold truncate ${
                isCompleted
                  ? "line-through text-slate-500 dark:text-zinc-500"
                  : "text-slate-900 dark:text-zinc-100"
              }`}
            >
              {task.title}
            </h3>
            <PriorityBadge priority={task.priority} />
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="mt-2.5 flex items-center flex-wrap gap-2 text-xs">
            {formattedDue && (
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  isOverdue
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-500 dark:text-zinc-400"
                }`}
              >
                {isOverdue ? <Clock className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                {formattedDue} {isOverdue && "(Overdue)"}
              </span>
            )}
            {project && <ProjectBadge project={project} />}
            {category && <CategoryBadge category={category} />}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          title="Edit task"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
