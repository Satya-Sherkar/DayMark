import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Repeat,
  Clock,
  Filter,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
  isValid,
} from "date-fns";
import { Task } from "../types/task";
import { Project } from "../types/project";
import { Category } from "../types/category";
import { Select, SelectOption } from "../components/ui/Select";
import { PriorityBadge } from "../components/tasks/PriorityBadge";

interface CalendarPageProps {
  tasks: Task[];
  projects?: Project[];
  categories?: Category[];
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onOpenQuickAdd: (prefilledDueAt?: string) => void;
}

type CalendarViewMode = "month" | "week";

export const CalendarPage: React.FC<CalendarPageProps> = ({
  tasks,
  projects = [],
  categories = [],
  onToggleComplete,
  onEditTask,
  onOpenQuickAdd,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else {
      setCurrentDate((prev) => subWeeks(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else {
      setCurrentDate((prev) => addWeeks(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter options for themed Select
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

  // Filter tasks based on criteria
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === "archived") return false;
      if (!t.dueAt) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (selectedProjectId && t.projectId !== selectedProjectId) return false;
      if (selectedCategoryId && t.categoryId !== selectedCategoryId) return false;
      return true;
    });
  }, [tasks, priorityFilter, selectedProjectId, selectedCategoryId]);

  // Tasks indexed by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filteredTasks) {
      if (!t.dueAt) continue;
      try {
        const d = parseISO(t.dueAt);
        if (isValid(d)) {
          const key = format(d, "yyyy-MM-dd");
          const existing = map.get(key) || [];
          existing.push(t);
          map.set(key, existing);
        }
      } catch {
        // Skip invalid date
      }
    }
    return map;
  }, [filteredTasks]);

  // Calendar days calculation
  const calendarDays = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calStart, end: calEnd });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, viewMode]);

  const viewTitle = useMemo(() => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy");
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (isSameMonth(weekStart, weekEnd)) {
        return `${format(weekStart, "MMM d")} – ${format(weekEnd, "d, yyyy")}`;
      }
      return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
    }
  }, [currentDate, viewMode]);

  const weekDayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* Editorial Calendar Header & Filter Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-dm-border">
        {/* Navigation & Title Group */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-dm-border rounded-[6px] bg-dm-surface divide-x divide-dm-border">
            <button
              onClick={handlePrev}
              className="p-1.5 text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-surface-hover transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-mono font-medium text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-surface-hover transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-surface-hover transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="font-heading text-lg font-bold text-dm-text-primary tracking-tight">
            {viewTitle}
          </h2>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented View Mode Toggle */}
          <div className="inline-flex p-0.5 rounded-[6px] bg-dm-sidebar border border-dm-border">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 rounded-[4px] text-xs font-sans transition-colors cursor-pointer ${
                viewMode === "month"
                  ? "bg-dm-surface text-dm-text-primary font-semibold border border-dm-border shadow-2xs"
                  : "text-dm-text-secondary hover:text-dm-text-primary border border-transparent font-medium"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-[4px] text-xs font-sans transition-colors cursor-pointer ${
                viewMode === "week"
                  ? "bg-dm-surface text-dm-text-primary font-semibold border border-dm-border shadow-2xs"
                  : "text-dm-text-secondary hover:text-dm-text-primary border border-transparent font-medium"
              }`}
            >
              Week
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs text-dm-text-secondary ml-1">
            <Filter className="w-3 h-3 text-dm-text-secondary shrink-0" />
            <span className="font-mono text-[10px] uppercase tracking-wider">
              Filter:
            </span>
          </div>

          <Select
            size="sm"
            className="min-w-[125px]"
            value={priorityFilter}
            onChange={(val) => setPriorityFilter(val)}
            options={priorityOptions}
          />

          <Select
            size="sm"
            className="min-w-[120px]"
            value={selectedProjectId || ""}
            onChange={(val) => setSelectedProjectId(val || null)}
            options={projectOptions}
          />

          <Select
            size="sm"
            className="min-w-[125px]"
            align="right"
            value={selectedCategoryId || ""}
            onChange={(val) => setSelectedCategoryId(val || null)}
            options={categoryOptions}
          />

          <button
            onClick={() => onOpenQuickAdd()}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-dm-accent hover:bg-dm-accent-hover text-white text-xs font-sans font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Grid */}
      {viewMode === "month" ? (
        <div className="border border-dm-border rounded-[8px] bg-dm-surface overflow-hidden shadow-xs">
          {/* Weekday Header Row */}
          <div className="grid grid-cols-7 border-b border-dm-border bg-dm-sidebar/60">
            {weekDayHeaders.map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-2 px-3 text-center font-mono text-[11px] font-semibold tracking-wider uppercase text-dm-text-secondary ${
                  idx < 6 ? "border-r border-dm-border" : ""
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDate.get(dateKey) || [];
              const isCurrMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              const isColEnd = (idx + 1) % 7 === 0;

              return (
                <div
                  key={dateKey}
                  className={`group relative min-h-[115px] p-1.5 border-b border-dm-border transition-colors ${
                    !isColEnd ? "border-r border-dm-border" : ""
                  } ${
                    isDayToday
                      ? "bg-dm-accent/[0.03]"
                      : isCurrMonth
                      ? "bg-dm-surface hover:bg-dm-surface-hover/50"
                      : "bg-dm-bg/40 opacity-45"
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span
                      className={`font-mono text-xs font-semibold inline-flex items-center justify-center ${
                        isDayToday
                          ? "w-5 h-5 rounded-full bg-dm-accent text-white font-bold"
                          : isCurrMonth
                          ? "text-dm-text-primary"
                          : "text-dm-text-secondary"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Quick Add Button on Hover */}
                    <button
                      onClick={() => {
                        const prefilled = `${format(day, "yyyy-MM-dd")}T12:00`;
                        onOpenQuickAdd(prefilled);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-dm-text-secondary hover:text-dm-accent hover:bg-dm-surface transition-all cursor-pointer"
                      title={`Add task for ${format(day, "MMM d")}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Tasks List in Cell */}
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => {
                      const isCompleted = task.status === "completed";
                      const project = projects.find((p) => p.id === task.projectId);

                      return (
                        <div
                          key={task.id}
                          onClick={() => onEditTask(task)}
                          className={`flex items-center gap-1.5 px-1.5 py-1 rounded-[4px] text-[11px] font-sans border transition-colors cursor-pointer group/item ${
                            isCompleted
                              ? "bg-dm-bg/80 border-dm-border text-dm-text-secondary line-through opacity-70"
                              : "bg-dm-surface border-dm-border hover:border-dm-accent hover:bg-dm-surface-hover text-dm-text-primary shadow-2xs"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleComplete(task);
                            }}
                            className={`w-3 h-3 rounded-[2px] border flex items-center justify-center shrink-0 cursor-pointer ${
                              isCompleted
                                ? "bg-dm-accent border-dm-accent text-white"
                                : "border-dm-border bg-dm-bg hover:border-dm-accent"
                            }`}
                          >
                            {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>

                          {project?.color && (
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: project.color }}
                            />
                          )}

                          <span className="truncate flex-1 font-medium">
                            {task.title}
                          </span>

                          {task.recurrenceRule && (
                            <Repeat className="w-2.5 h-2.5 text-dm-accent shrink-0" />
                          )}
                        </div>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <div className="px-1.5 py-0.5 font-mono text-[10px] text-dm-text-secondary font-medium">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View Grid */
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isDayToday = isToday(day);

            return (
              <div
                key={dateKey}
                className={`flex flex-col rounded-[8px] border bg-dm-surface overflow-hidden ${
                  isDayToday
                    ? "border-dm-accent/50 ring-1 ring-dm-accent/20 shadow-xs"
                    : "border-dm-border"
                }`}
              >
                {/* Day Header */}
                <div
                  className={`p-2.5 border-b border-dm-border flex items-center justify-between ${
                    isDayToday ? "bg-dm-accent/10" : "bg-dm-sidebar/60"
                  }`}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-dm-text-secondary">
                      {format(day, "EEE")}
                    </span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        isDayToday ? "text-dm-accent" : "text-dm-text-primary"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  <span className="px-1.5 py-0.5 rounded-full font-mono text-[10px] bg-dm-surface border border-dm-border text-dm-text-secondary">
                    {dayTasks.length}
                  </span>
                </div>

                {/* Day Tasks Column */}
                <div className="p-2 flex-1 space-y-2 min-h-[320px] max-h-[500px] overflow-y-auto">
                  {dayTasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <span className="font-mono text-[11px] text-dm-text-secondary italic">
                        No tasks
                      </span>
                    </div>
                  ) : (
                    dayTasks.map((task) => {
                      const isCompleted = task.status === "completed";
                      const project = projects.find((p) => p.id === task.projectId);
                      const category = categories.find((c) => c.id === task.categoryId);

                      let dueTimeStr = "";
                      if (task.dueAt) {
                        try {
                          const d = parseISO(task.dueAt);
                          if (isValid(d)) {
                            dueTimeStr = format(d, "HH:mm");
                          }
                        } catch {
                          // ignore
                        }
                      }

                      return (
                        <div
                          key={task.id}
                          onClick={() => onEditTask(task)}
                          className={`p-2.5 rounded-[6px] border transition-colors cursor-pointer group ${
                            isCompleted
                              ? "bg-dm-bg/60 border-dm-border opacity-70"
                              : "bg-dm-surface border-dm-border hover:border-dm-accent hover:bg-dm-surface-hover shadow-2xs"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete(task);
                              }}
                              className={`mt-0.5 w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 cursor-pointer ${
                                isCompleted
                                  ? "bg-dm-accent border-dm-accent text-white"
                                  : "border-dm-border bg-dm-bg hover:border-dm-accent"
                              }`}
                            >
                              {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-xs font-sans font-medium leading-snug truncate ${
                                  isCompleted
                                    ? "line-through text-dm-text-secondary"
                                    : "text-dm-text-primary"
                                }`}
                              >
                                {task.title}
                              </h4>

                              <div className="mt-1.5 flex items-center flex-wrap gap-1.5 text-[10px]">
                                {dueTimeStr && dueTimeStr !== "00:00" && (
                                  <span className="inline-flex items-center gap-0.5 font-mono text-dm-text-secondary">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{dueTimeStr}</span>
                                  </span>
                                )}

                                <PriorityBadge priority={task.priority} />

                                {project && (
                                  <span className="inline-flex items-center gap-1 font-sans text-dm-text-secondary">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: project.color }}
                                    />
                                    <span className="truncate max-w-[80px]">
                                      {project.name}
                                    </span>
                                  </span>
                                )}

                                {category && (
                                  <span className="text-dm-text-secondary font-sans">
                                    {category.name}
                                  </span>
                                )}

                                {task.recurrenceRule && (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-dm-accent"
                                    title={`Repeats ${task.recurrenceRule}`}
                                  >
                                    <Repeat className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Task for Day Footer */}
                <div className="p-1.5 border-t border-dm-border bg-dm-sidebar/40">
                  <button
                    onClick={() => {
                      const prefilled = `${format(day, "yyyy-MM-dd")}T12:00`;
                      onOpenQuickAdd(prefilled);
                    }}
                    className="w-full py-1 px-2 rounded-[4px] border border-dashed border-dm-border hover:border-dm-accent text-dm-text-secondary hover:text-dm-accent font-sans text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
