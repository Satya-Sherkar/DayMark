import { Filter, Inbox, Plus, X } from "lucide-react";
import { Task } from "../types/task";
import { Project } from "../types/project";
import { Category } from "../types/category";
import { TaskCard } from "../components/tasks/TaskCard";

interface TasksPageProps {
  tasks: Task[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (priority: string) => void;
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onOpenQuickAdd: () => void;
  isLoading: boolean;
  projects?: Project[];
  categories?: Category[];
  selectedProjectId?: string | null;
  onSelectProject?: (id: string | null) => void;
  selectedCategoryId?: string | null;
  onSelectCategory?: (id: string | null) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onOpenQuickAdd,
  isLoading,
  projects = [],
  categories = [],
  selectedProjectId = null,
  onSelectProject,
  selectedCategoryId = null,
  onSelectCategory,
}) => {
  const statusTabs = [
    { id: "all", label: "All Tasks" },
    { id: "pending", label: "Pending" },
    { id: "completed", label: "Completed" },
  ];

  const activeProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;
  const activeCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Active Scope / Filter Pill if filtered from sidebar */}
      {(activeProject || activeCategory) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs">
          <span className="font-semibold text-blue-900 dark:text-blue-300">
            Active Filter:
          </span>
          {activeProject && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white font-medium"
              style={{ backgroundColor: activeProject.color }}
            >
              <span>Project: {activeProject.name}</span>
              {onSelectProject && (
                <button
                  onClick={() => onSelectProject(null)}
                  className="hover:opacity-75"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}
          {activeCategory && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white font-medium"
              style={{ backgroundColor: activeCategory.color }}
            >
              <span>Category: {activeCategory.name}</span>
              {onSelectCategory && (
                <button
                  onClick={() => onSelectCategory(null)}
                  className="hover:opacity-75"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}
        </div>
      )}

      {/* Filter and control bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filters:</span>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Project filter dropdown */}
          <select
            value={selectedProjectId || ""}
            onChange={(e) => onSelectProject && onSelectProject(e.target.value || null)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.archived ? "(Archived)" : ""}
              </option>
            ))}
          </select>

          {/* Category filter dropdown */}
          <select
            value={selectedCategoryId || ""}
            onChange={(e) => onSelectCategory && onSelectCategory(e.target.value || null)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenQuickAdd}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task List Content */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 dark:text-zinc-500 text-sm">
          Loading tasks from local database...
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
          <Inbox className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
            No tasks found
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
            {statusFilter !== "all" || priorityFilter !== "all" || selectedProjectId || selectedCategoryId
              ? "Try adjusting your filters or search query to find what you're looking for."
              : "Get started by creating your first task in Daymark."}
          </p>
          <button
            onClick={onOpenQuickAdd}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
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
  );
};
