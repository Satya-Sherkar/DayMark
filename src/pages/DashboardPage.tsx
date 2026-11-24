import { useMemo } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  ListTodo,
  Plus,
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
      (t) => t.status !== "completed" && t.dueAt && new Date(t.dueAt) < now && !t.dueAt.startsWith(todayIso)
    );
  }, [tasks, todayIso]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
            {greeting}!
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")} • Daymark local workspace
          </p>
        </div>

        <button
          onClick={onOpenQuickAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Total Tasks
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-3">
            {summary ? summary.totalTasks : "—"}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            {summary ? `${summary.pendingTasks} pending completion` : "Loading..."}
          </p>
        </div>

        {/* Due Today */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Due Today
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-3">
            {summary ? summary.dueToday : "—"}
          </p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
            Deadlines for today
          </p>
        </div>

        {/* Overdue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Overdue
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-3">
            {summary ? summary.overdue : "—"}
          </p>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1 font-medium">
            Requires immediate attention
          </p>
        </div>

        {/* Completed Today */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Completed Today
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">
            {summary ? summary.completedToday : "—"}
          </p>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">
            Completed in local database
          </p>
        </div>
      </div>

      {/* Overdue Alert Section if any */}
      {overdueTasks.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Overdue Tasks ({overdueTasks.length})</span>
            </div>
          </div>
          <div className="space-y-2.5">
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

      {/* Tasks Due Today Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Tasks Due Today
            </h3>
          </div>
          <button
            onClick={onViewAllTasks}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all tasks →
          </button>
        </div>

        {dueTodayTasks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
            <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">
              No tasks due today. You're all caught up!
            </p>
            <button
              onClick={onOpenQuickAdd}
              className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule a task for today</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
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
