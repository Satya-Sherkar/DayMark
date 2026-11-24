import {
  CheckSquare,
  Calendar,
  Clock,
  LayoutDashboard,
  Moon,
  Sun,
  ShieldCheck,
  Folder,
  Tag,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { Project } from "../../types/project";
import { Category } from "../../types/category";

export type NavTab = "dashboard" | "tasks" | "today" | "upcoming";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  projects?: Project[];
  categories?: Category[];
  selectedProjectId?: string | null;
  selectedCategoryId?: string | null;
  onSelectProject?: (id: string | null) => void;
  onSelectCategory?: (id: string | null) => void;
  onOpenCreateProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
  onOpenCreateCategory?: () => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isDark,
  onToggleTheme,
  projects = [],
  categories = [],
  selectedProjectId = null,
  selectedCategoryId = null,
  onSelectProject,
  onSelectCategory,
  onOpenCreateProject,
  onEditProject,
  onDeleteProject,
  onOpenCreateCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks" as NavTab, label: "My Tasks", icon: CheckSquare },
    { id: "today" as NavTab, label: "Today", icon: Calendar },
    { id: "upcoming" as NavTab, label: "Upcoming", icon: Clock },
  ];

  const handleProjectClick = (projectId: string) => {
    onTabChange("tasks");
    if (onSelectProject) {
      onSelectProject(selectedProjectId === projectId ? null : projectId);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    onTabChange("tasks");
    if (onSelectCategory) {
      onSelectCategory(selectedCategoryId === categoryId ? null : categoryId);
    }
  };

  return (
    <aside className="w-64 bg-slate-50 dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 flex flex-col justify-between select-none h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* App Branding */}
        <div className="p-6 pb-4 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
            D
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Daymark
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
              Ubuntu Desktop • v0.1.0
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1 mt-1 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id &&
              (item.id !== "tasks" || (!selectedProjectId && !selectedCategoryId));
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (item.id !== "tasks") {
                    if (onSelectProject) onSelectProject(null);
                    if (onSelectCategory) onSelectCategory(null);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 dark:text-zinc-500"}`}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Projects Section */}
        <div className="px-3 mt-6 shrink-0">
          <div className="flex items-center justify-between px-3 py-1 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5" />
              <span>Projects</span>
            </span>
            {onOpenCreateProject && (
              <button
                onClick={onOpenCreateProject}
                className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
                title="Create Project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {projects.length === 0 ? (
              <p className="px-3 py-1.5 text-xs text-slate-400 dark:text-zinc-600 italic">
                No projects yet
              </p>
            ) : (
              projects.map((project) => {
                const isSelected =
                  activeTab === "tasks" && selectedProjectId === project.id;
                return (
                  <div
                    key={project.id}
                    className={`group flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <button
                      onClick={() => handleProjectClick(project.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate">{project.name}</span>
                    </button>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEditProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProject(project);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-300/50 dark:hover:bg-zinc-700 transition-colors"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(project.id);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Categories Section */}
        <div className="px-3 mt-5 shrink-0 pb-4">
          <div className="flex items-center justify-between px-3 py-1 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Categories</span>
            </span>
            {onOpenCreateCategory && (
              <button
                onClick={onOpenCreateCategory}
                className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
                title="Create Category"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {categories.length === 0 ? (
              <p className="px-3 py-1.5 text-xs text-slate-400 dark:text-zinc-600 italic">
                No categories yet
              </p>
            ) : (
              categories.map((category) => {
                const isSelected =
                  activeTab === "tasks" && selectedCategoryId === category.id;
                return (
                  <div
                    key={category.id}
                    className={`group flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <button
                      onClick={() => handleCategoryClick(category.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <Tag
                        className="w-3 h-3 shrink-0"
                        style={{ color: category.color }}
                      />
                      <span className="truncate">{category.name}</span>
                    </button>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEditCategory && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCategory(category);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-300/50 dark:hover:bg-zinc-700 transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteCategory && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCategory(category.id);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 border-t border-slate-200 dark:border-zinc-800/80 space-y-3 shrink-0">
        {/* Local & Offline indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Offline & SQLite Local</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            {isDark ? (
              <Moon className="w-4 h-4 text-blue-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>{isDark ? "Dark Theme" : "Light Theme"}</span>
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
            {isDark ? "Dark" : "Light"}
          </span>
        </button>
      </div>
    </aside>
  );
};
