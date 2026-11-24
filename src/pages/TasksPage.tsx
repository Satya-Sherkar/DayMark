import React, { useMemo } from "react";
import { Filter, Plus, X, Inbox } from "lucide-react";
import { Task } from "../types/task";
import { Project } from "../types/project";
import { Category } from "../types/category";
import { TaskCard } from "../components/tasks/TaskCard";
import { Select, SelectOption } from "../components/ui/Select";

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

  const priorityOptions: SelectOption[] = [
    { value: "all", label: "All Priorities" },
    { value: "urgent", label: "Urgent", color: "#C64D38" },
    { value: "high", label: "High", color: "#D17B54" },
    { value: "medium", label: "Medium", color: "#C48439" },
    { value: "low", label: "Low", color: "#77746D" },
  ];

  const projectOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "All Projects" },
      ...projects.map((p) => ({
        value: p.id,
        label: `${p.name}${p.archived ? " (Archived)" : ""}`,
        color: p.color || undefined,
      })),
    ],
    [projects]
  );

  const categoryOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "All Categories" },
      ...categories.map((c) => ({
        value: c.id,
        label: c.name,
        color: c.color || undefined,
      })),
    ],
    [categories]
  );

  const activeProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;
  const activeCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  return (
    <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Active Filter Scope Indicator */}
      {(activeProject || activeCategory) && (
        <div className="flex items-center gap-2 p-2.5 rounded-[6px] bg-dm-surface border border-dm-border text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider text-dm-text-secondary">
            Filter Scope:
          </span>
          {activeProject && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] font-sans text-xs border"
              style={{
                borderColor: `${activeProject.color}45`,
                backgroundColor: `${activeProject.color}15`,
                color: activeProject.color,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: activeProject.color }}
              />
              <span>Project: {activeProject.name}</span>
              {onSelectProject && (
                <button
                  onClick={() => onSelectProject(null)}
                  className="hover:opacity-75 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}
          {activeCategory && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] font-sans text-xs border"
              style={{
                borderColor: `${activeCategory.color}45`,
                backgroundColor: `${activeCategory.color}15`,
                color: activeCategory.color,
              }}
            >
              <span>Category: {activeCategory.name}</span>
              {onSelectCategory && (
                <button
                  onClick={() => onSelectCategory(null)}
                  className="hover:opacity-75 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}
        </div>
      )}

      {/* Editorial Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dm-border">
        {/* Status Segmented Control */}
        <div className="inline-flex p-0.5 rounded-[6px] bg-dm-sidebar border border-dm-border self-start">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-3 py-1 rounded-[4px] text-xs font-sans transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-dm-surface text-dm-text-primary font-semibold border border-dm-border shadow-2xs"
                  : "text-dm-text-secondary hover:text-dm-text-primary border border-transparent font-medium"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-dm-text-secondary">
            <Filter className="w-3 h-3 text-dm-text-secondary shrink-0" />
            <span className="font-mono text-[10px] uppercase tracking-wider">
              Filter:
            </span>
          </div>

          <Select
            size="sm"
            className="min-w-[125px]"
            value={priorityFilter}
            onChange={(val) => onPriorityFilterChange(val)}
            options={priorityOptions}
          />

          <Select
            size="sm"
            className="min-w-[120px]"
            value={selectedProjectId || ""}
            onChange={(val) => onSelectProject && onSelectProject(val || null)}
            options={projectOptions}
          />

          <Select
            size="sm"
            className="min-w-[125px]"
            align="right"
            value={selectedCategoryId || ""}
            onChange={(val) => onSelectCategory && onSelectCategory(val || null)}
            options={categoryOptions}
          />

          <button
            onClick={onOpenQuickAdd}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium font-sans text-white bg-dm-accent hover:bg-dm-accent-hover rounded-[6px] transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Task List Content */}
      {isLoading ? (
        <div className="p-12 text-center text-dm-text-secondary font-mono text-xs">
          Loading tasks from local database...
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center rounded-[6px] border border-dashed border-dm-border bg-dm-surface/30">
          <Inbox className="w-8 h-8 mx-auto text-dm-text-secondary opacity-40 mb-2" />
          <h3 className="font-heading text-sm font-semibold text-dm-text-primary">
            No matching tasks
          </h3>
          <p className="font-sans text-xs text-dm-text-secondary mt-1 max-w-sm mx-auto">
            {statusFilter !== "all" || priorityFilter !== "all" || selectedProjectId || selectedCategoryId
              ? "No tasks match the active filters or search parameters. Try adjusting your filter selection."
              : "No tasks have been created yet. Add a task to begin tracking your work."}
          </p>
          <button
            onClick={onOpenQuickAdd}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium font-sans text-white bg-dm-accent hover:bg-dm-accent-hover rounded-[6px] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Task</span>
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
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
