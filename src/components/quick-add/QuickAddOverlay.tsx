import React, { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { taskService } from "../../services/taskService";
import { projectService } from "../../services/projectService";
import { Project } from "../../types/project";
import { TaskPriority } from "../../types/task";
import { useZoom } from "../../hooks/useZoom";
import { ZoomIndicator } from "../ui/ZoomIndicator";
import { Calendar, Flag, Folder, CornerDownLeft, Plus, Check } from "lucide-react";

export const QuickAddOverlay: React.FC = () => {
  const { percentage, showIndicator } = useZoom();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueOption, setDueOption] = useState<"none" | "today" | "tomorrow">("none");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync dark theme with system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = (dark: boolean) => {
      if (dark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    applyTheme(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Fetch available projects for optional quick tagging
  useEffect(() => {
    projectService
      .listProjects(false)
      .then((res) => setProjects(res))
      .catch((err) => console.warn("Could not load projects in quick add:", err));
  }, []);

  // Focus input whenever window receives focus or Tauri emits focus event
  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  useEffect(() => {
    focusInput();
    window.addEventListener("focus", focusInput);

    let unlisten: (() => void) | undefined;
    listen("focus-quick-input", () => {
      focusInput();
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      window.removeEventListener("focus", focusInput);
      if (unlisten) unlisten();
    };
  }, [focusInput]);

  const handleClose = async () => {
    setTitle("");
    setDueOption("none");
    setPriority("medium");
    setSelectedProjectId(null);
    try {
      await invoke("hide_quick_add");
    } catch (err) {
      console.warn("Failed to hide quick add window:", err);
    }
  };

  const calculateDueAt = (): string | undefined => {
    const now = new Date();
    if (dueOption === "today") {
      now.setHours(23, 59, 59, 999);
      return now.toISOString();
    }
    if (dueOption === "tomorrow") {
      now.setDate(now.getDate() + 1);
      now.setHours(23, 59, 59, 999);
      return now.toISOString();
    }
    return undefined;
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const dueAt = calculateDueAt();
      await taskService.createTask({
        title: trimmedTitle,
        priority,
        dueAt: dueAt || null,
        projectId: selectedProjectId || null,
      });

      // Notify main window to reload data
      await emit("task-created-globally", {});

      setShowSuccess(true);
      setTimeout(async () => {
        setShowSuccess(false);
        await handleClose();
        setIsSubmitting(false);
      }, 250);
    } catch (err) {
      console.error("Failed to create quick task:", err);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  // 1-click cycle priority: medium -> high -> urgent -> low -> medium
  const cyclePriority = () => {
    const order: TaskPriority[] = ["medium", "high", "urgent", "low"];
    const nextIdx = (order.indexOf(priority) + 1) % order.length;
    setPriority(order[nextIdx]);
  };

  // 1-click cycle due date: none -> today -> tomorrow -> none
  const cycleDueDate = () => {
    const order: Array<"none" | "today" | "tomorrow"> = ["none", "today", "tomorrow"];
    const nextIdx = (order.indexOf(dueOption) + 1) % order.length;
    setDueOption(order[nextIdx]);
  };

  const getPriorityStyle = () => {
    switch (priority) {
      case "urgent":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "low":
        return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      default:
        return "text-dm-text-secondary bg-dm-surface-hover border-dm-border";
    }
  };

  return (
    <div className="w-screen h-screen p-2 box-border bg-transparent select-none overflow-hidden font-sans">
      <div className="w-full h-full bg-dm-surface border border-dm-border rounded-xl shadow-2xl flex flex-col justify-between p-3 box-border transition-all duration-150 backdrop-blur-md">
        {/* Top: Brand mark + Main input + Submit */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-dm-accent/15 border border-dm-accent/30 flex items-center justify-center shrink-0 text-dm-accent shadow-xs">
            {showSuccess ? <Check className="w-4 h-4 text-green-500" /> : <Plus className="w-4 h-4" />}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task... (press Enter to save)"
            className="flex-1 min-w-0 bg-transparent border-none outline-none font-sans text-sm font-medium text-dm-text-primary placeholder:text-dm-text-secondary/50 tracking-tight"
            autoFocus
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-dm-accent hover:bg-dm-accent-hover text-white text-xs font-mono font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer shrink-0"
          >
            <span>Add</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </div>

        {/* Bottom: Minimalist pill controls + Key hints */}
        <div className="flex items-center justify-between pt-2 border-t border-dm-border/50 text-xs">
          {/* Quick attribute toggles */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {/* Due date cycle pill */}
            <button
              type="button"
              onClick={cycleDueDate}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                dueOption !== "none"
                  ? "bg-dm-accent/10 border-dm-accent/40 text-dm-accent font-semibold"
                  : "bg-dm-surface-hover/80 border-dm-border text-dm-text-secondary hover:text-dm-text-primary"
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>
                {dueOption === "today" ? "Today" : dueOption === "tomorrow" ? "Tomorrow" : "No Date"}
              </span>
            </button>

            {/* Priority cycle pill */}
            <button
              type="button"
              onClick={cyclePriority}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${getPriorityStyle()}`}
            >
              <Flag className="w-3 h-3" />
              <span className="capitalize">{priority}</span>
            </button>

            {/* Optional Project dropdown pill */}
            {projects.length > 0 && (
              <div className="relative flex items-center">
                <Folder className="w-3 h-3 text-dm-text-secondary absolute left-2 pointer-events-none" />
                <select
                  value={selectedProjectId || ""}
                  onChange={(e) => setSelectedProjectId(e.target.value || null)}
                  className="max-w-[130px] truncate pl-6 pr-2 py-0.5 rounded-full border border-dm-border bg-dm-surface-hover/80 text-dm-text-secondary hover:text-dm-text-primary text-[11px] font-mono outline-none cursor-pointer appearance-none transition-colors"
                >
                  <option value="">Inbox</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Key hints */}
          <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-dm-text-secondary/60">
            <span className="flex items-center gap-0.5">
              <kbd className="px-1 py-0.2 rounded bg-dm-bg border border-dm-border text-dm-text-primary">↵</kbd>
              <span> save</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <kbd className="px-1 py-0.2 rounded bg-dm-bg border border-dm-border text-dm-text-primary">Esc</kbd>
              <span> dismiss</span>
            </span>
          </div>
        </div>
      </div>
      <ZoomIndicator percentage={percentage} visible={showIndicator} />
    </div>
  );
};
