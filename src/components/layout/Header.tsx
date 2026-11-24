import React from "react";
import { Plus, Search, PanelLeft } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenQuickAdd: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  onOpenQuickAdd,
  isSidebarCollapsed,
  onToggleSidebar,
}) => {
  return (
    <header className="h-14 px-6 border-b border-dm-border bg-dm-bg flex items-center justify-between gap-4 select-none shrink-0">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-[6px] text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-surface border border-transparent hover:border-dm-border transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
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
        {/* Compact Search */}
        <div className="relative w-56 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-dm-text-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-8 pr-3 py-1.5 text-xs font-sans rounded-[6px] border border-dm-border bg-dm-surface text-dm-text-primary placeholder:text-dm-text-secondary focus:outline-none focus:border-dm-accent focus:ring-1 focus:ring-dm-accent transition-colors"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenQuickAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium font-sans text-white bg-dm-accent hover:bg-dm-accent-hover rounded-[6px] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-dm-accent/30 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};
