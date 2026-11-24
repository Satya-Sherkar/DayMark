import { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { DashboardPage } from "./pages/DashboardPage";
import { TasksPage } from "./pages/TasksPage";
import { TaskModal } from "./components/tasks/TaskModal";
import { taskService } from "./services/taskService";
import { CreateTaskInput, DashboardSummary, Task, UpdateTaskInput } from "./types/task";
import "./App.css";

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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

      const [loadedTasks, loadedSummary] = await Promise.all([
        taskService.listTasks({
          status: statusFilter === "all" ? undefined : statusFilter,
          priority: priorityFilter === "all" ? undefined : priorityFilter,
          search: searchQuery.trim() || undefined,
          dueFilter,
        }),
        taskService.getDashboardSummary(),
      ]);

      setTasks(loadedTasks);
      setSummary(loadedSummary);
    } catch (err: unknown) {
      console.error("Failed to load tasks:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleModalSubmit = async (input: CreateTaskInput | UpdateTaskInput) => {
    if (editingTask) {
      await taskService.updateTask(editingTask.id, input);
    } else {
      await taskService.createTask(input as CreateTaskInput);
    }
    await loadData();
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard";
      case "tasks":
        return "My Tasks";
      case "today":
        return "Today's Agenda";
      case "upcoming":
        return "Upcoming Tasks";
      default:
        return "Daymark";
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans antialiased overflow-hidden select-none">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "today" || tab === "upcoming") {
            setStatusFilter("pending");
          }
        }}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          title={getPageTitle()}
          subtitle="Offline task manager"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenQuickAdd={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-700 dark:text-rose-400 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={loadData}
                className="font-semibold underline hover:no-underline ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {activeTab === "dashboard" ? (
            <DashboardPage
              summary={summary}
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onOpenQuickAdd={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              onViewAllTasks={() => setActiveTab("tasks")}
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
                setIsModalOpen(true);
              }}
              isLoading={isLoading}
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
        }}
        onSubmit={handleModalSubmit}
        initialTask={editingTask}
      />
    </div>
  );
}

export default App;
