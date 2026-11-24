import { useMemo } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Plus,
  ArrowRight,
  Search,
  X,
} from "lucide-react";
import { DashboardSummary, Task } from "../types/task";
import { Project } from "../types/project";
import { Category } from "../types/category";
import { TaskCard } from "../components/tasks/TaskCard";

interface DashboardPageProps {
  summary: DashboardSummary | null;
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onOpenQuickAdd: () => void;
  onViewAllTasks: () => void;
  projects?: Project[];
  categories?: Category[];
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  tasks,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onOpenQuickAdd,
  onViewAllTasks,
  projects = [],
  categories = [],
  searchQuery,
  onClearSearch,
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);

  const dueTodayTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.status !== "completed" && t.dueAt && t.dueAt.startsWith(todayIso)
    );
  }, [tasks, todayIso]);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.dueAt &&
        new Date(t.dueAt) < now &&
        !t.dueAt.startsWith(todayIso)
    );
  }, [tasks, todayIso]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Editorial Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-dm-border">
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold text-dm-text-primary tracking-tight">
            Agenda & Overview
          </h2>
          <p className="font-mono text-xs text-dm-text-secondary mt-0.5">
            {format(new Date(), "EEEE, MMMM d, yyyy")} • Local Workspace
          </p>
        </div>
      </div>

      {/* Swiss Editorial Unified Metrics Bar */}
      <div className="bg-dm-surface border border-dm-border rounded-[6px] grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-dm-border overflow-hidden">
        {/* Total Tasks */}
        <div className="p-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
            Total Active
          </div>
          <div className="font-mono text-2xl font-bold text-dm-text-primary mt-1.5 leading-none">
            {summary ? summary.totalTasks : "—"}
          </div>
          <div className="font-sans text-[11px] text-dm-text-secondary mt-2">
            {summary ? `${summary.pendingTasks} pending` : "Reading SQLite..."}
          </div>
        </div>

        {/* Due Today */}
        <div className="p-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
            Due Today
          </div>
          <div className="font-mono text-2xl font-bold text-dm-text-primary mt-1.5 leading-none">
            {summary ? summary.dueToday : "—"}
          </div>
          <div className="font-sans text-[11px] text-dm-text-secondary mt-2">
            Schedule for today
          </div>
        </div>

        {/* Overdue */}
        <div className="p-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
            Overdue
          </div>
          <div
            className={`font-mono text-2xl font-bold mt-1.5 leading-none ${
              summary && summary.overdue > 0
                ? "text-dm-accent"
                : "text-dm-text-primary"
            }`}
          >
            {summary ? summary.overdue : "—"}
          </div>
          <div className="font-sans text-[11px] text-dm-text-secondary mt-2">
            Requires action
          </div>
        </div>

        {/* Completed Today */}
        <div className="p-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
            Completed Today
          </div>
          <div className="font-mono text-2xl font-bold text-dm-text-primary mt-1.5 leading-none">
            {summary ? summary.completedToday : "—"}
          </div>
          <div className="font-sans text-[11px] text-dm-text-secondary mt-2">
            Logged in database
          </div>
        </div>
      </div>

      {/* Prominent Search Results Banner on Dashboard */}
      {searchQuery && searchQuery.trim().length > 0 && (
        <div className="space-y-3 p-4 rounded-[6px] border border-dm-accent/30 bg-dm-accent/5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-dm-accent/20">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-dm-accent shrink-0" />
              <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-dm-accent">
                Search Results ({tasks.length})
              </h3>
              <span className="font-mono text-xs text-dm-text-secondary">
                matching &quot;{searchQuery}&quot;
              </span>
            </div>
            {onClearSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                className="inline-flex items-center gap-1 font-sans text-xs text-dm-text-secondary hover:text-dm-text-primary hover:underline cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear search</span>
              </button>
            )}
          </div>

          {tasks.length === 0 ? (
            <p className="font-sans text-xs text-dm-text-secondary py-3 text-center">
              No tasks found matching &quot;{searchQuery}&quot;.
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const category = categories.find((c) => c.id === task.categoryId);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={project}
                    category={category}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Overdue Tasks Section */}
      {overdueTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-dm-accent shrink-0" />
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-dm-accent">
              Overdue Attention ({overdueTasks.length})
            </h3>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const category = categories.find((c) => c.id === task.categoryId);
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  project={project}
                  category={category}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Due Today Tasks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-dm-text-secondary shrink-0" />
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-dm-text-primary">
              Scheduled For Today
            </h3>
            <span className="font-mono text-[10px] text-dm-text-secondary">
              ({dueTodayTasks.length})
            </span>
          </div>

          <button
            onClick={onViewAllTasks}
            className="inline-flex items-center gap-1 font-sans text-xs text-dm-text-secondary hover:text-dm-text-primary hover:underline cursor-pointer"
          >
            <span>View all tasks</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {dueTodayTasks.length === 0 ? (
          <div className="p-8 text-center rounded-[6px] border border-dashed border-dm-border bg-dm-surface/30">
            <Calendar className="w-6 h-6 mx-auto text-dm-text-secondary opacity-40 mb-2" />
            <p className="font-sans text-xs text-dm-text-secondary">
              No tasks scheduled for today.
            </p>
            <button
              onClick={onOpenQuickAdd}
              className="mt-2 font-sans text-xs text-dm-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Schedule a task for today</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {dueTodayTasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const category = categories.find((c) => c.id === task.categoryId);
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  project={project}
                  category={category}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
