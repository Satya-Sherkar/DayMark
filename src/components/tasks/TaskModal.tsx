import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CreateTaskInput, Task, TaskPriority, UpdateTaskInput } from "../../types/task";
import { Project } from "../../types/project";
import { Category } from "../../types/category";

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
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-[6px] border border-dm-border bg-dm-bg text-dm-text-primary text-xs font-sans focus:outline-none focus:border-dm-accent focus:ring-1 focus:ring-dm-accent cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
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
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-[6px] border border-dm-border bg-dm-bg text-dm-text-primary text-xs font-sans focus:outline-none focus:border-dm-accent focus:ring-1 focus:ring-dm-accent cursor-pointer"
              >
                <option value="">No Project</option>
                {projects
                  .filter((p) => !p.archived || p.id === projectId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.archived ? "(Archived)" : ""}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1">
                Category (Optional)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-[6px] border border-dm-border bg-dm-bg text-dm-text-primary text-xs font-sans focus:outline-none focus:border-dm-accent focus:ring-1 focus:ring-dm-accent cursor-pointer"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
