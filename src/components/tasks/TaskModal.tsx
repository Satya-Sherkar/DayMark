import { useState, useEffect, useMemo } from "react";
import {
  X,
  MinusCircle,
  Repeat,
  CalendarDays,
  RotateCcw,
  CalendarRange,
  Bell,
  BellOff,
  BellRing,
  Clock,
  Calendar,
  Trash2,
} from "lucide-react";
import { CreateTaskInput, Task, TaskPriority, UpdateTaskInput } from "../../types/task";
import { Reminder } from "../../types/reminder";
import { reminderService } from "../../services/reminderService";
import { format } from "date-fns";
import { Project } from "../../types/project";
import { Category } from "../../types/category";
import { Select, SelectOption } from "../ui/Select";
import { DateTimePicker } from "../ui/DateTimePicker";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput | UpdateTaskInput) => Promise<Task | void>;
  initialTask?: Task | null;
  initialDueAt?: string | null;
  projects?: Project[];
  categories?: Category[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  initialDueAt,
  projects = [],
  categories = [],
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueAt, setDueAt] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [recurrenceRule, setRecurrenceRule] = useState<string>("");
  const [reminderPreset, setReminderPreset] = useState<string>("");
  const [customReminderTime, setCustomReminderTime] = useState<string>("");
  const [existingReminders, setExistingReminders] = useState<Reminder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reminderPresetOptions: SelectOption[] = [
    {
      value: "",
      label: "No reminder",
      icon: <BellOff className="w-3.5 h-3.5" />,
      description: "Do not schedule a notification",
    },
    {
      value: "0",
      label: "At due time",
      icon: <Bell className="w-3.5 h-3.5" />,
      description: "Remind exactly when due",
    },
    {
      value: "15",
      label: "15 minutes before",
      icon: <Clock className="w-3.5 h-3.5" />,
      description: "15m prior to scheduled due time",
    },
    {
      value: "30",
      label: "30 minutes before",
      icon: <Clock className="w-3.5 h-3.5" />,
      description: "30m prior to scheduled due time",
    },
    {
      value: "60",
      label: "1 hour before",
      icon: <Clock className="w-3.5 h-3.5" />,
      description: "1h prior to scheduled due time",
    },
    {
      value: "1440",
      label: "1 day before",
      icon: <Calendar className="w-3.5 h-3.5" />,
      description: "24h prior to scheduled due time",
    },
    {
      value: "custom",
      label: "Custom time...",
      icon: <BellRing className="w-3.5 h-3.5" />,
      description: "Specify an exact date & time",
    },
  ];

  const recurrenceOptions: SelectOption[] = [
    {
      value: "",
      label: "Does not repeat",
      icon: <MinusCircle className="w-3.5 h-3.5" />,
      description: "One-time task without recurrence",
    },
    {
      value: "daily",
      label: "Daily",
      icon: <Repeat className="w-3.5 h-3.5" />,
      description: "Repeats every day at scheduled time",
    },
    {
      value: "weekdays",
      label: "Weekdays (Mon-Fri)",
      icon: <CalendarDays className="w-3.5 h-3.5" />,
      description: "Monday through Friday (skips weekends)",
    },
    {
      value: "weekly",
      label: "Weekly",
      icon: <RotateCcw className="w-3.5 h-3.5" />,
      description: "Repeats once every week on the same day",
    },
    {
      value: "monthly",
      label: "Monthly",
      icon: <CalendarRange className="w-3.5 h-3.5" />,
      description: "Repeats once a month on the same date",
    },
  ];

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
      setRecurrenceRule(initialTask.recurrenceRule || "");
      setReminderPreset("");
      setCustomReminderTime("");
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

      reminderService
        .listRemindersForTask(initialTask.id)
        .then(setExistingReminders)
        .catch((err) => console.error("Failed to list reminders for task:", err));
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueAt(initialDueAt || "");
      setProjectId("");
      setCategoryId("");
      setRecurrenceRule("");
      setReminderPreset("");
      setCustomReminderTime("");
      setExistingReminders([]);
    }
    setError(null);
  }, [initialTask, initialDueAt, isOpen]);

  // Support Esc key to close dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleDeleteExistingReminder = async (reminderId: string) => {
    try {
      await reminderService.deleteReminder(reminderId);
      setExistingReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (err: unknown) {
      setError(`Failed to delete reminder: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const computeReminderAt = (preset: string, customTime: string, dueAtLocal: string): string | null => {
    if (!preset) return null;
    if (preset === "custom") {
      if (!customTime) return null;
      try {
        return new Date(customTime).toISOString();
      } catch {
        return null;
      }
    }
    if (!dueAtLocal) return null;
    try {
      const dueDate = new Date(dueAtLocal);
      if (isNaN(dueDate.getTime())) return null;
      const minutesBefore = parseInt(preset, 10);
      if (isNaN(minutesBefore)) return null;
      return new Date(dueDate.getTime() - minutesBefore * 60 * 1000).toISOString();
    } catch {
      return null;
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title cannot be empty");
      return;
    }

    if (reminderPreset && reminderPreset !== "custom" && !dueAt) {
      setError("To set a relative reminder, please specify a Due Date & Time first, or choose a custom time.");
      return;
    }

    if (reminderPreset === "custom" && !customReminderTime) {
      setError("Please select a date and time for the custom reminder.");
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
      const saved = await onSubmit({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        priority,
        dueAt: dueAtUtc,
        projectId: projectId ? projectId : null,
        categoryId: categoryId ? categoryId : null,
        recurrenceRule: recurrenceRule ? recurrenceRule : null,
      });

      const targetTaskId = (saved && "id" in saved ? saved.id : undefined) || initialTask?.id;
      const remindAtIso = computeReminderAt(reminderPreset, customReminderTime, dueAt);

      if (remindAtIso && targetTaskId) {
        await reminderService.createReminder({
          taskId: targetTaskId,
          remindAt: remindAtIso,
        });
      }

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="bg-dm-surface border border-dm-border rounded-[8px] w-full max-w-lg shadow-xl animate-in fade-in duration-150">
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
              <DateTimePicker
                value={dueAt}
                onChange={setDueAt}
                placeholder="Set due date & time..."
                align="right"
                direction="auto"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1">
                Recurrence (Optional)
              </label>
              <Select
                value={recurrenceRule}
                onChange={(val) => setRecurrenceRule(val)}
                options={recurrenceOptions}
                direction="auto"
                className="w-full"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1">
                Add Reminder (Optional)
              </label>
              <Select
                value={reminderPreset}
                onChange={(val) => setReminderPreset(val)}
                options={reminderPresetOptions}
                direction="auto"
                className="w-full"
              />
            </div>
          </div>

          {reminderPreset === "custom" && (
            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1">
                Custom Reminder Date & Time
              </label>
              <DateTimePicker
                value={customReminderTime}
                onChange={setCustomReminderTime}
                placeholder="Pick reminder date & time..."
                align="right"
                direction="auto"
              />
            </div>
          )}

          {/* Existing Scheduled Reminders (for Edit Task) */}
          {existingReminders.length > 0 && (
            <div className="pt-1">
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1.5">
                Active Reminders ({existingReminders.length})
              </label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-0.5">
                {existingReminders.map((rem) => {
                  const isDelivered = !!rem.deliveredAt;
                  const isDismissed = !!rem.dismissedAt;
                  let dateFormatted = "";
                  try {
                    dateFormatted = format(new Date(rem.remindAt), "MMM d, yyyy · h:mm a");
                  } catch {
                    dateFormatted = rem.remindAt;
                  }
                  return (
                    <div
                      key={rem.id}
                      className="flex items-center justify-between px-3 py-1.5 bg-dm-bg border border-dm-border rounded-[6px] text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 text-dm-text-secondary truncate mr-2">
                        <Bell className="w-3.5 h-3.5 text-dm-accent shrink-0" />
                        <span className="text-dm-text-primary truncate">{dateFormatted}</span>
                        {isDelivered && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-dm-surface text-dm-text-secondary border border-dm-border shrink-0">
                            {isDismissed ? "Dismissed" : "Delivered"}
                          </span>
                        )}
                        {!isDelivered && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-dm-accent/10 text-dm-accent border border-dm-accent/20 shrink-0">
                            Scheduled
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingReminder(rem.id)}
                        className="p-1 text-dm-text-secondary hover:text-dm-accent transition-colors cursor-pointer rounded shrink-0"
                        title="Delete reminder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
