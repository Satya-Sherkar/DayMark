import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { CreateTaskInput, Task, TaskPriority, UpdateTaskInput } from "../../types/task";
import { Project } from "../../types/project";
import { Category } from "../../types/category";
import { Select, SelectOption } from "../ui/Select";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  initialTask?: Task | null;
  projects?: Project[];
  categories?: Category[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  projects = [],
  categories = [],
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueAt, setDueAt] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const priorityOptions: SelectOption<TaskPriority>[] = [
    { value: "low", label: "Low", color: "#77746D" },
    { value: "medium", label: "Medium", color: "#C48439" },
    { value: "high", label: "High", color: "#D17B54" },
    { value: "urgent", label: "Urgent", color: "#C64D38" },
  ];

  const projectOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "No Project" },
      ...projects
        .filter((p) => !p.archived || p.id === projectId)
        .map((p) => ({
          value: p.id,
          label: `${p.name}${p.archived ? " (Archived)" : ""}`,
          color: p.color || undefined,
        })),
    ],
    [projects, projectId]
  );

  const categoryOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "No Category" },
      ...categories.map((c) => ({
        value: c.id,
        label: c.name,
        color: c.color || undefined,
      })),
    ],
    [categories]
  );

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || "");
      setPriority(initialTask.priority);
      setProjectId(initialTask.projectId || "");
      setCategoryId(initialTask.categoryId || "");
      if (initialTask.dueAt) {
        try {
          const date = new Date(initialTask.dueAt);
          const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setDueAt(localIso);
        } catch {
          setDueAt("");
        }
      } else {
        setDueAt("");
      }
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueAt("");
      setProjectId("");
      setCategoryId("");
    }
    setError(null);
  }, [initialTask, isOpen]);

  // Support Esc key to close dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let dueAtUtc: string | null = null;
    if (dueAt) {
      try {
        dueAtUtc = new Date(dueAt).toISOString();
      } catch {
        dueAtUtc = null;
      }
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        priority,
        dueAt: dueAtUtc,
        projectId: projectId ? projectId : null,
        categoryId: categoryId ? categoryId : null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="bg-dm-surface border border-dm-border rounded-[8px] w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in duration-150">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dm-border">
          <h2 className="font-heading text-sm font-bold text-dm-text-primary tracking-tight">
            {initialTask ? "Edit Task" : "New Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-dm-text-secondary hover:text-dm-text-primary p-1 rounded-[4px] hover:bg-dm-bg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-dm-accent/10 border border-dm-accent/30 rounded-[4px] text-xs font-sans text-dm-accent">
              {error}
            </div>
          )}

          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 rounded-[6px] border border-dm-border bg-dm-bg text-dm-text-primary placeholder:text-dm-text-secondary text-xs sm:text-sm font-sans focus:outline-none focus:border-dm-accent focus:ring-1 focus:ring-dm-accent transition-colors"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, notes, or subtasks..."
              className="w-full px-3 py-2 rounded-[6px] border border-dm-border bg-dm-bg text-dm-text-primary placeholder:text-dm-text-secondary text-xs sm:text-sm font-sans focus:outline-none focus:border-dm-accent focus:ring-1 focus:ring-dm-accent transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1">
                Priority
              </label>
              <Select<TaskPriority>
                value={priority}
                onChange={(val) => setPriority(val)}
                options={priorityOptions}
                className="w-full"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full px-3 py-1.5 rounded-[6px] border border-dm-border bg-dm-bg text-dm-text-primary text-xs font-mono focus:outline-none focus:border-dm-accent focus:ring-1 focus:ring-dm-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1">
                Project (Optional)
              </label>
              <Select
                value={projectId}
                onChange={(val) => setProjectId(val)}
                options={projectOptions}
                className="w-full"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1">
                Category (Optional)
              </label>
              <Select
                value={categoryId}
                onChange={(val) => setCategoryId(val)}
                options={categoryOptions}
                className="w-full"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-dm-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-sans font-medium text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-bg rounded-[6px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-sans font-medium text-white bg-dm-accent hover:bg-dm-accent-hover disabled:opacity-50 rounded-[6px] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-dm-accent/30"
            >
              {isSubmitting ? "Saving..." : initialTask ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
