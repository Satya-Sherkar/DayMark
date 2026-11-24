import React from "react";
import {
  CheckSquare,
  Calendar,
  CalendarDays,
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
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  BarChart3,
} from "lucide-react";
import { Project } from "../../types/project";
import { Category } from "../../types/category";

export type NavTab = "dashboard" | "tasks" | "calendar" | "today" | "upcoming" | "analytics";

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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSettings?: () => void;
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
  isCollapsed = false,
  onToggleCollapse,
  onOpenSettings,
}) => {
  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks" as NavTab, label: "My Tasks", icon: CheckSquare },
    { id: "calendar" as NavTab, label: "Calendar", icon: CalendarDays },
    { id: "today" as NavTab, label: "Today", icon: Calendar },
    { id: "upcoming" as NavTab, label: "Upcoming", icon: Clock },
    { id: "analytics" as NavTab, label: "Analytics", icon: BarChart3 },
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
    <aside
      className={`bg-dm-sidebar border-r border-dm-border flex flex-col justify-between select-none h-full transition-[width] duration-200 ease-in-out shrink-0 ${
        isCollapsed ? "w-14" : "w-60"
      }`}
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden">
        {/* App Branding */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-dm-border shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src="/icon.svg"
              alt="Daymark"
              className="w-6 h-6 rounded-[5px] shrink-0 object-contain shadow-xs"
            />
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="font-heading text-sm font-bold text-dm-text-primary tracking-tight leading-none">
                  Daymark
                </h1>
                <p className="font-mono text-[9px] text-dm-text-secondary mt-0.5 uppercase tracking-wider leading-none">
                  Desktop • v0.1.0
                </p>
              </div>
            )}
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="p-1 rounded-[4px] text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-surface/60 transition-colors cursor-pointer"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-2 space-y-0.5 shrink-0">
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
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] text-xs font-sans transition-colors cursor-pointer ${
                  isActive
                    ? "bg-dm-surface text-dm-text-primary font-semibold border border-dm-border shadow-2xs"
                    : "text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-surface/50 border border-transparent font-medium"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-dm-accent" : "text-dm-text-secondary"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {!isCollapsed && (
          <>
            {/* Projects Section */}
            <div className="px-2 mt-4 shrink-0">
              <div className="flex items-center justify-between px-2 py-1 mb-0.5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary flex items-center gap-1.5">
                  <Folder className="w-3 h-3" />
                  <span>Projects</span>
                </span>
                {onOpenCreateProject && (
                  <button
                    onClick={onOpenCreateProject}
                    className="p-1 rounded-[4px] text-dm-text-secondary hover:text-dm-accent hover:bg-dm-surface/60 transition-colors cursor-pointer"
                    title="New Project"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-0.5">
                {projects.length === 0 ? (
                  <p className="px-2 py-1 text-[11px] text-dm-text-secondary/60 italic font-sans">
                    No projects
                  </p>
                ) : (
                  projects.map((project) => {
                    const isSelected =
                      activeTab === "tasks" && selectedProjectId === project.id;
                    return (
                      <div
                        key={project.id}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors ${
                          isSelected
                            ? "bg-dm-surface text-dm-text-primary font-semibold border border-dm-border"
                            : "text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-surface/50 border border-transparent"
                        }`}
                      >
                        <button
                          onClick={() => handleProjectClick(project.id)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                        >
                          <span
                            className="w-2 h-2 rounded-[2px] shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate font-sans">{project.name}</span>
                        </button>

                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onEditProject && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditProject(project);
                              }}
                              className="p-1 rounded-[3px] text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-surface transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {onDeleteProject && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteProject(project.id);
                              }}
                              className="p-1 rounded-[3px] text-dm-text-secondary hover:text-dm-accent hover:bg-dm-surface transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
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
            <div className="px-2 mt-4 shrink-0 pb-3">
              <div className="flex items-center justify-between px-2 py-1 mb-0.5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  <span>Categories</span>
                </span>
                {onOpenCreateCategory && (
                  <button
                    onClick={onOpenCreateCategory}
                    className="p-1 rounded-[4px] text-dm-text-secondary hover:text-dm-accent hover:bg-dm-surface/60 transition-colors cursor-pointer"
                    title="New Category"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-0.5">
                {categories.length === 0 ? (
                  <p className="px-2 py-1 text-[11px] text-dm-text-secondary/60 italic font-sans">
                    No categories
                  </p>
                ) : (
                  categories.map((category) => {
                    const isSelected =
                      activeTab === "tasks" && selectedCategoryId === category.id;
                    return (
                      <div
                        key={category.id}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors ${
                          isSelected
                            ? "bg-dm-surface text-dm-text-primary font-semibold border border-dm-border"
                            : "text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-surface/50 border border-transparent"
                        }`}
                      >
                        <button
                          onClick={() => handleCategoryClick(category.id)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="truncate font-sans">{category.name}</span>
                        </button>

                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onEditCategory && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditCategory(category);
                              }}
                              className="p-1 rounded-[3px] text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-surface transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {onDeleteCategory && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCategory(category.id);
                              }}
                              className="p-1 rounded-[3px] text-dm-text-secondary hover:text-dm-accent hover:bg-dm-surface transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-3 border-t border-dm-border space-y-2 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] bg-dm-surface/50 border border-dm-border font-mono text-[10px] text-dm-text-secondary">
            <ShieldCheck className="w-3.5 h-3.5 text-dm-accent shrink-0" />
            <span className="truncate">Offline • SQLite</span>
          </div>
        )}

        {/* Settings Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            title="Open Settings"
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs font-sans text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-surface border border-transparent hover:border-dm-border transition-colors cursor-pointer ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-dm-accent" />
              {!isCollapsed && <span>Settings</span>}
            </span>
            {!isCollapsed && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-dm-text-secondary">
                System
              </span>
            )}
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs font-sans text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-surface border border-transparent hover:border-dm-border transition-colors cursor-pointer ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <span className="flex items-center gap-2">
            {isDark ? (
              <Moon className="w-3.5 h-3.5 text-dm-accent" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-dm-accent" />
            )}
            {!isCollapsed && <span>{isDark ? "Dark Theme" : "Light Theme"}</span>}
          </span>
          {!isCollapsed && (
            <span className="font-mono text-[9px] uppercase tracking-wider text-dm-text-secondary">
              {isDark ? "Dark" : "Light"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
