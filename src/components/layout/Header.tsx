import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  X,
  CheckCircle2,
  Circle,
  Calendar,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { Task } from "../../types/task";
import { Project } from "../../types/project";
import { Category } from "../../types/category";
import { taskService } from "../../services/taskService";

interface HeaderProps {
  title: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenQuickAdd: (prefilledTitle?: string) => void;
  onSelectTask?: (task: Task) => void;
  onToggleCompleteTask?: (task: Task) => void;
  onSubmitSearch?: () => void;
  onClearSearch?: () => void;
  projects?: Project[];
  categories?: Category[];
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  onOpenQuickAdd,
  onSelectTask,
  onToggleCompleteTask,
  onSubmitSearch,
  onClearSearch,
  projects = [],
  categories = [],
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live search query effect
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsLoadingResults(false);
      setIsDropdownOpen(false);
      return;
    }

    let isCancelled = false;
    setIsLoadingResults(true);
    setIsDropdownOpen(true);
    setHighlightedIndex(-1);

    const timer = setTimeout(() => {
      taskService
        .listTasks({ search: trimmed })
        .then((tasks) => {
          if (!isCancelled) {
            setSearchResults(tasks);
            setIsLoadingResults(false);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.error("Search query error:", err);
            setSearchResults([]);
            setIsLoadingResults(false);
          }
        });
    }, 40);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen && e.key !== "Enter") {
      if (searchQuery.trim()) {
        setIsDropdownOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < searchResults.length &&
          onSelectTask
        ) {
          onSelectTask(searchResults[highlightedIndex]);
          setIsDropdownOpen(false);
        } else if (onSubmitSearch) {
          onSubmitSearch();
          setIsDropdownOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsDropdownOpen(false);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleClear = () => {
    if (onClearSearch) {
      onClearSearch();
    } else {
      onSearchChange("");
    }
    setSearchResults([]);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const formatDueDate = (dueAt?: string | null) => {
    if (!dueAt) return null;
    const parsed = parseISO(dueAt);
    if (!isValid(parsed)) return dueAt;
    return format(parsed, "MMM d, yyyy");
  };

  return (
    <header className="h-14 px-6 border-b border-dm-border bg-dm-bg flex items-center justify-between gap-4 select-none shrink-0 relative z-30">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-heading text-sm font-bold text-dm-text-primary tracking-tight leading-none">
            {title}
          </h2>
          {subtitle && (
            <p className="font-mono text-[11px] text-dm-text-secondary mt-0.5 leading-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Interactive Search Bar & Dropdown */}
        <div ref={containerRef} className="relative w-64 sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-dm-text-secondary pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) setIsDropdownOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks anywhere... (Enter to view all)"
            className="w-full pl-8 pr-8 py-1.5 text-xs font-sans rounded-[6px] border border-dm-border bg-dm-surface text-dm-text-primary placeholder:text-dm-text-secondary focus:outline-none focus:border-dm-accent focus:ring-1 focus:ring-dm-accent transition-colors"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-bg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown Popover */}
          {isDropdownOpen && searchQuery.trim().length > 0 && (
            <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 bg-dm-surface border border-dm-border rounded-[8px] shadow-2xl overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              {/* Dropdown Header */}
              <div className="px-3.5 py-2 border-b border-dm-border bg-dm-bg/60 flex items-center justify-between text-[11px] font-mono text-dm-text-secondary">
                <span>
                  {isLoadingResults
                    ? "Searching workspace..."
                    : `Matching tasks (${searchResults.length})`}
                </span>
                {isLoadingResults && (
                  <Loader2 className="w-3 h-3 animate-spin text-dm-accent" />
                )}
              </div>

              {/* Results List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-dm-border/50">
                {isLoadingResults && searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-dm-text-secondary">
                    Searching tasks...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-xs text-dm-text-secondary">
                      No tasks found matching &quot;{searchQuery}&quot;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenQuickAdd(searchQuery);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans text-dm-accent hover:bg-dm-accent/10 rounded-[4px] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create task &quot;{searchQuery}&quot;</span>
                    </button>
                  </div>
                ) : (
                  searchResults.map((task, index) => {
                    const isSelected = index === highlightedIndex;
                    const project = projects.find((p) => p.id === task.projectId);
                    const category = categories.find((c) => c.id === task.categoryId);
                    const isCompleted = task.status === "completed";

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          if (onSelectTask) {
                            onSelectTask(task);
                            setIsDropdownOpen(false);
                          }
                        }}
                        className={`p-2.5 flex items-start gap-2.5 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-dm-accent/10 border-l-2 border-dm-accent pl-2"
                            : "hover:bg-dm-bg/60"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleCompleteTask) {
                              onToggleCompleteTask(task);
                            }
                          }}
                          className="mt-0.5 text-dm-text-secondary hover:text-dm-accent transition-colors cursor-pointer shrink-0"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-dm-text-secondary/70 hover:text-dm-accent" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-sans font-medium truncate ${
                              isCompleted
                                ? "line-through text-dm-text-secondary"
                                : "text-dm-text-primary"
                            }`}
                          >
                            {task.title}
                          </p>

                          {task.description && (
                            <p className="text-[11px] font-sans text-dm-text-secondary truncate mt-0.5">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] font-mono">
                            {task.dueAt && (
                              <span className="inline-flex items-center gap-1 text-dm-text-secondary bg-dm-bg px-1.5 py-0.5 rounded border border-dm-border">
                                <Calendar className="w-2.5 h-2.5 text-dm-accent" />
                                <span>{formatDueDate(task.dueAt)}</span>
                              </span>
                            )}

                            {project && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border"
                                style={{
                                  borderColor: `${project.color}40`,
                                  backgroundColor: `${project.color}15`,
                                  color: project.color,
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: project.color }}
                                />
                                <span>{project.name}</span>
                              </span>
                            )}

                            {category && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border"
                                style={{
                                  borderColor: `${category.color}40`,
                                  backgroundColor: `${category.color}15`,
                                  color: category.color,
                                }}
                              >
                                <span>{category.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer */}
              {searchResults.length > 0 && (
                <div className="px-3.5 py-2 border-t border-dm-border bg-dm-bg/80 flex items-center justify-between text-[11px] font-sans">
                  <span className="text-dm-text-secondary font-mono text-[10px]">
                    Press Enter to view all
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSubmitSearch) onSubmitSearch();
                      setIsDropdownOpen(false);
                    }}
                    className="inline-flex items-center gap-1 text-dm-accent hover:underline font-medium cursor-pointer"
                  >
                    <span>View in My Tasks</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => onOpenQuickAdd()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium font-sans text-white bg-dm-accent hover:bg-dm-accent-hover rounded-[6px] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-dm-accent/30 shrink-0 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};
