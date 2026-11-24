import { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { DashboardPage } from "./pages/DashboardPage";
import { TasksPage } from "./pages/TasksPage";
import { TaskModal } from "./components/tasks/TaskModal";
import { ProjectModal } from "./components/projects/ProjectModal";
import { CategoryModal } from "./components/categories/CategoryModal";
import { taskService } from "./services/taskService";
import { projectService } from "./services/projectService";
import { categoryService } from "./services/categoryService";
import { CreateTaskInput, DashboardSummary, Task, UpdateTaskInput } from "./types/task";
import { CreateProjectInput, Project, UpdateProjectInput } from "./types/project";
import { Category, CreateCategoryInput, UpdateCategoryInput } from "./types/category";
import "./App.css";

export function App() {
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

  // Modal State for Projects
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Modal State for Categories
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

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

  const handleModalSubmit = async (input: CreateTaskInput | UpdateTaskInput) => {
    if (editingTask) {
      await taskService.updateTask(editingTask.id, input);
    } else {
      await taskService.createTask(input as CreateTaskInput);
    }
    await loadData();
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

          {activeTab === "dashboard" && !selectedProjectId && !selectedCategoryId ? (
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
                setIsModalOpen(true);
              }}
              onViewAllTasks={() => {
                setSelectedProjectId(null);
                setSelectedCategoryId(null);
                setActiveTab("tasks");
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
        }}
        onSubmit={handleModalSubmit}
        initialTask={editingTask}
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
    </div>
  );
}

export default App;
