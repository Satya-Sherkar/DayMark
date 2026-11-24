import { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { DashboardPage } from "./pages/DashboardPage";
import { TasksPage } from "./pages/TasksPage";
import { CalendarPage } from "./pages/CalendarPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { TaskModal } from "./components/tasks/TaskModal";
import { ProjectModal } from "./components/projects/ProjectModal";
import { CategoryModal } from "./components/categories/CategoryModal";
import { SettingsModal } from "./components/settings/SettingsModal";
import { taskService } from "./services/taskService";
import { projectService } from "./services/projectService";
import { categoryService } from "./services/categoryService";
import { reminderService } from "./services/reminderService";
import { CreateTaskInput, DashboardSummary, Task, UpdateTaskInput } from "./types/task";
import { CreateProjectInput, Project, UpdateProjectInput } from "./types/project";
import { Category, CreateCategoryInput, UpdateCategoryInput } from "./types/category";
import { DueReminder } from "./types/reminder";
import { useZoom } from "./hooks/useZoom";
import { ZoomIndicator } from "./components/ui/ZoomIndicator";
import { listen } from "@tauri-apps/api/event";
import { Bell, X, CheckCircle2 } from "lucide-react";
import "./App.css";

export function App() {
  const { percentage, showIndicator } = useZoom();
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State for Tasks
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDueAt, setModalDueAt] = useState<string | null>(null);

  // Active Alert for delivered reminders
  const [activeAlert, setActiveAlert] = useState<DueReminder | null>(null);

  // Modal State for Projects
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Modal State for Categories
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Modal State for Settings
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Sidebar Collapse State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Request desktop notification permission on startup
  useEffect(() => {
    reminderService.ensurePermission().catch((err) => {
      console.warn("Could not request notification permissions:", err);
    });
  }, []);

  // Apply dark class to html document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let dueFilter: "today" | "upcoming" | undefined = undefined;
      if (activeTab === "today") dueFilter = "today";
      if (activeTab === "upcoming") dueFilter = "upcoming";

      const [loadedTasks, loadedProjects, loadedCategories, loadedSummary] =
        await Promise.all([
          taskService.listTasks({
            status: statusFilter === "all" ? undefined : statusFilter,
            priority: priorityFilter === "all" ? undefined : priorityFilter,
            projectId: selectedProjectId || undefined,
            categoryId: selectedCategoryId || undefined,
            search: searchQuery.trim() || undefined,
            dueFilter,
          }),
          projectService.listProjects(true),
          categoryService.listCategories(),
          taskService.getDashboardSummary(),
        ]);

      setTasks(loadedTasks);
      setProjects(loadedProjects);
      setCategories(loadedCategories);
      setSummary(loadedSummary);
    } catch (err: unknown) {
      console.error("Failed to load data:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    statusFilter,
    priorityFilter,
    selectedProjectId,
    selectedCategoryId,
    searchQuery,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for background reminder deliveries
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    reminderService
      .onReminderDelivered((reminder) => {
        setActiveAlert(reminder);
        loadData();
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      if (unlisten) unlisten();
    };
  }, [loadData]);

  // Listen for global shortcut or tray "Quick Add" trigger
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen("open-quick-add", () => {
      setEditingTask(null);
      setModalDueAt(null);
      setIsModalOpen(true);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Memory & CPU conservation: Refresh data only when window becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loadData]);

  // Task actions
  const handleToggleComplete = async (task: Task) => {
    try {
      if (task.status === "completed") {
        await taskService.reopenTask(task.id);
      } else {
        await taskService.completeTask(task.id);
      }
      await loadData();
    } catch (err: unknown) {
      alert(`Error updating task: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await taskService.deleteTask(id);
        await loadData();
      } catch (err: unknown) {
        alert(`Error deleting task: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  const handleModalSubmit = async (input: CreateTaskInput | UpdateTaskInput): Promise<Task> => {
    let saved: Task;
    if (editingTask) {
      saved = await taskService.updateTask(editingTask.id, input);
    } else {
      saved = await taskService.createTask(input as CreateTaskInput);
    }
    await loadData();
    return saved;
  };

  const handleDismissAlert = async () => {
    if (activeAlert) {
      try {
        await reminderService.dismissReminder(activeAlert.id);
      } catch (err) {
        console.error("Failed to dismiss reminder:", err);
      }
      setActiveAlert(null);
    }
  };

  const handleCompleteTaskFromAlert = async () => {
    if (activeAlert) {
      try {
        await taskService.completeTask(activeAlert.taskId);
        await reminderService.dismissReminder(activeAlert.id);
        await loadData();
      } catch (err) {
        console.error("Failed to complete task from alert:", err);
      }
      setActiveAlert(null);
    }
  };

  // Project actions
  const handleProjectSubmit = async (input: CreateProjectInput | UpdateProjectInput) => {
    if (editingProject) {
      await projectService.updateProject(editingProject.id, input);
    } else {
      await projectService.createProject(input as CreateProjectInput);
    }
    await loadData();
  };

  const handleDeleteProject = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this project? Associated tasks will be kept and unassigned."
      )
    ) {
      try {
        await projectService.deleteProject(id);
        if (selectedProjectId === id) setSelectedProjectId(null);
        await loadData();
      } catch (err: unknown) {
        alert(`Error deleting project: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  // Category actions
  const handleCategorySubmit = async (input: CreateCategoryInput | UpdateCategoryInput) => {
    if (editingCategory) {
      await categoryService.updateCategory(editingCategory.id, input);
    } else {
      await categoryService.createCategory(input as CreateCategoryInput);
    }
    await loadData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? Associated tasks will be kept and unassigned."
      )
    ) {
      try {
        await categoryService.deleteCategory(id);
        if (selectedCategoryId === id) setSelectedCategoryId(null);
        await loadData();
      } catch (err: unknown) {
        alert(`Error deleting category: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  const getPageTitle = () => {
    if (selectedProjectId) {
      const p = projects.find((proj) => proj.id === selectedProjectId);
      return p ? `Project: ${p.name}` : "My Tasks";
    }
    if (selectedCategoryId) {
      const c = categories.find((cat) => cat.id === selectedCategoryId);
      return c ? `Category: ${c.name}` : "My Tasks";
    }
    switch (activeTab) {
      case "dashboard":
        return "Dashboard";
      case "tasks":
        return "My Tasks";
      case "calendar":
        return "Calendar";
      case "today":
        return "Today's Agenda";
      case "upcoming":
        return "Upcoming Tasks";
      case "analytics":
        return "Productivity Analytics";
      default:
        return "Daymark";
    }
  };

  return (
    <div className="flex h-screen w-screen bg-dm-bg text-dm-text-primary font-sans antialiased overflow-hidden select-none">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "today" || tab === "upcoming") {
            setStatusFilter("pending");
          }
          if (tab === "analytics" || tab === "dashboard" || tab === "calendar") {
            setSelectedProjectId(null);
            setSelectedCategoryId(null);
          }
        }}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        projects={projects}
        categories={categories}
        selectedProjectId={selectedProjectId}
        selectedCategoryId={selectedCategoryId}
        onSelectProject={(id) => {
          setSelectedProjectId(id);
          if (id) setSelectedCategoryId(null);
        }}
        onSelectCategory={(id) => {
          setSelectedCategoryId(id);
          if (id) setSelectedProjectId(null);
        }}
        onOpenCreateProject={() => {
          setEditingProject(null);
          setIsProjectModalOpen(true);
        }}
        onEditProject={(proj) => {
          setEditingProject(proj);
          setIsProjectModalOpen(true);
        }}
        onDeleteProject={handleDeleteProject}
        onOpenCreateCategory={() => {
          setEditingCategory(null);
          setIsCategoryModalOpen(true);
        }}
        onEditCategory={(cat) => {
          setEditingCategory(cat);
          setIsCategoryModalOpen(true);
        }}
        onDeleteCategory={handleDeleteCategory}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-dm-bg">
        <Header
          title={getPageTitle()}
          subtitle="Offline Personal Productivity"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenQuickAdd={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        <main className="flex-1 p-6 overflow-y-auto bg-dm-bg">
          {error && (
            <div className="mb-4 p-3 rounded-[6px] bg-dm-accent/10 border border-dm-accent/30 text-xs font-sans text-dm-accent flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={loadData}
                className="font-semibold underline hover:no-underline ml-4 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {activeTab === "analytics" && !selectedProjectId && !selectedCategoryId ? (
            <AnalyticsPage />
          ) : activeTab === "dashboard" && !selectedProjectId && !selectedCategoryId ? (
            <DashboardPage
              summary={summary}
              tasks={tasks}
              projects={projects}
              categories={categories}
              onToggleComplete={handleToggleComplete}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onOpenQuickAdd={() => {
                setEditingTask(null);
                setModalDueAt(null);
                setIsModalOpen(true);
              }}
              onViewAllTasks={() => {
                setSelectedProjectId(null);
                setSelectedCategoryId(null);
                setActiveTab("tasks");
              }}
            />
          ) : activeTab === "calendar" && !selectedProjectId && !selectedCategoryId ? (
            <CalendarPage
              tasks={tasks}
              projects={projects}
              categories={categories}
              onToggleComplete={handleToggleComplete}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsModalOpen(true);
              }}
              onOpenQuickAdd={(prefilledDueAt) => {
                setEditingTask(null);
                setModalDueAt(prefilledDueAt || null);
                setIsModalOpen(true);
              }}
            />
          ) : (
            <TasksPage
              tasks={tasks}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              onToggleComplete={handleToggleComplete}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onOpenQuickAdd={() => {
                setEditingTask(null);
                setModalDueAt(null);
                setIsModalOpen(true);
              }}
              isLoading={isLoading}
              projects={projects}
              categories={categories}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          )}
        </main>
      </div>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
          setModalDueAt(null);
        }}
        onSubmit={handleModalSubmit}
        initialTask={editingTask}
        initialDueAt={modalDueAt}
        projects={projects}
        categories={categories}
      />

      {/* Project Create / Edit Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleProjectSubmit}
        initialProject={editingProject}
      />

      {/* Category Create / Edit Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCategorySubmit}
        initialCategory={editingCategory}
      />

      {/* Settings & System Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onDataRestored={loadData}
      />

      {/* In-App Reminder Alert Banner */}
      {activeAlert && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="bg-dm-surface border border-dm-border shadow-xl rounded-[8px] p-4 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-dm-accent">
                <Bell className="w-4 h-4 animate-bounce" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
                  Reminder Due
                </span>
              </div>
              <button
                onClick={handleDismissAlert}
                className="text-dm-text-secondary hover:text-dm-text-primary p-0.5 rounded hover:bg-dm-bg transition-colors cursor-pointer"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h4 className="font-heading text-sm font-semibold text-dm-text-primary leading-tight">
                {activeAlert.taskTitle}
              </h4>
              <p className="text-xs text-dm-text-secondary mt-0.5 font-mono">
                Priority: <span className="uppercase font-semibold">{activeAlert.taskPriority}</span>
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-dm-border">
              <button
                onClick={handleDismissAlert}
                className="px-2.5 py-1 text-xs font-sans text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-bg rounded-[4px] transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={handleCompleteTaskFromAlert}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-medium text-white bg-dm-accent hover:bg-dm-accent-hover rounded-[4px] transition-colors cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Feedback Indicator */}
      <ZoomIndicator percentage={percentage} visible={showIndicator} />
    </div>
  );
}

export default App;
