import {
  CheckSquare,
  Calendar,
  Clock,
  LayoutDashboard,
  Moon,
  Sun,
  ShieldCheck,
} from "lucide-react";

export type NavTab = "dashboard" | "tasks" | "today" | "upcoming";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isDark,
  onToggleTheme,
}) => {
  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks" as NavTab, label: "My Tasks", icon: CheckSquare },
    { id: "today" as NavTab, label: "Today", icon: Calendar },
    { id: "upcoming" as NavTab, label: "Upcoming", icon: Clock },
  ];

  return (
    <aside className="w-64 bg-slate-50 dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 flex flex-col justify-between select-none">
      <div>
        {/* App Branding */}
        <div className="p-6 pb-5 flex items-center gap-3">
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
        <nav className="px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 dark:text-zinc-500"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 border-t border-slate-200 dark:border-zinc-800/80 space-y-3">
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
            {isDark ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
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
