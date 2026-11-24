import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  AlertCircle,
  RefreshCw,
  Folder,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { analyticsService } from "../services/analyticsService";
import { ProductivityOverview } from "../types/analytics";

export const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<ProductivityOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"14d" | "30d">("14d");

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getProductivityOverview();
      setOverview(data);
    } catch (err) {
      console.error("Failed to load productivity analytics:", err);
      setError(typeof err === "string" ? err : "Failed to load productivity analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter trend data according to chosen timeframe
  const filteredTrendData = useMemo(() => {
    if (!overview || !overview.daily_completions) return [];
    const count = timeframe === "14d" ? 14 : 30;
    const slice = overview.daily_completions.slice(-count);
    return slice.map((item) => {
      // Format YYYY-MM-DD to MMM d (e.g. Nov 24)
      const parts = item.date.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const mIdx = parseInt(parts[1], 10) - 1;
      const formattedDate = `${monthNames[mIdx]} ${parseInt(parts[2], 10)}`;
      return {
        ...item,
        displayDate: formattedDate,
      };
    });
  }, [overview, timeframe]);

  // Project distribution chart data
  const projectChartData = useMemo(() => {
    if (!overview || !overview.project_distribution) return [];
    return overview.project_distribution.map((p) => ({
      name: p.project_name,
      total: p.total_tasks,
      completed: p.completed_tasks,
      pending: p.pending_tasks,
      color: p.project_color || "#78716c",
    }));
  }, [overview]);

  // Priority chart data
  const priorityChartData = useMemo(() => {
    if (!overview || !overview.priority_distribution) return [];
    const priorityLabels: Record<string, string> = {
      urgent: "Urgent",
      high: "High",
      medium: "Medium",
      low: "Low",
    };
    const priorityColors: Record<string, string> = {
      urgent: "#ef4444",
      high: "#f97316",
      medium: "#f59e0b",
      low: "#6b7280",
    };
    return overview.priority_distribution.map((p) => ({
      name: priorityLabels[p.priority] || p.priority,
      total: p.total_tasks,
      completed: p.completed_tasks,
      pending: p.pending_tasks,
      color: priorityColors[p.priority] || "#78716c",
    }));
  }, [overview]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-dm-border">
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold text-dm-text-primary tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-dm-accent" />
            Productivity Analytics
          </h2>
          <p className="font-mono text-xs text-dm-text-secondary mt-0.5">
            Offline SQLite Telemetry & Insights • Local-First
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe switch */}
          <div className="bg-dm-surface border border-dm-border rounded-[4px] p-0.5 flex items-center text-xs font-mono">
            <button
              onClick={() => setTimeframe("14d")}
              className={`px-2.5 py-1 rounded-[3px] transition-colors cursor-pointer ${
                timeframe === "14d"
                  ? "bg-dm-accent text-white font-medium"
                  : "text-dm-text-secondary hover:text-dm-text-primary"
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setTimeframe("30d")}
              className={`px-2.5 py-1 rounded-[3px] transition-colors cursor-pointer ${
                timeframe === "30d"
                  ? "bg-dm-accent text-white font-medium"
                  : "text-dm-text-secondary hover:text-dm-text-primary"
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            disabled={isLoading}
            title="Refresh Analytics"
            className="p-1.5 rounded-[4px] border border-dm-border bg-dm-surface text-dm-text-secondary hover:text-dm-text-primary hover:border-dm-text-secondary/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[6px] text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Metrics Bar */}
      <div className="bg-dm-surface border border-dm-border rounded-[6px] grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-dm-border overflow-hidden shadow-xs">
        {/* Completion Rate */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
              Completion Rate
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-dm-accent" />
          </div>
          <div className="font-mono text-2xl font-bold text-dm-text-primary mt-1.5 leading-none">
            {overview ? `${overview.completion_rate.toFixed(1)}%` : "—"}
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-dm-bg rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-dm-accent h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(overview?.completion_rate || 0, 100)}%` }}
              />
            </div>
            <div className="font-sans text-[11px] text-dm-text-secondary mt-1.5">
              {overview ? `${overview.completed_tasks} of ${overview.total_tasks} completed` : "Loading..."}
            </div>
          </div>
        </div>

        {/* Current & Best Streak */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
              Activity Streak
            </span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="font-mono text-2xl font-bold text-dm-text-primary mt-1.5 leading-none flex items-baseline gap-1.5">
            <span>{overview ? overview.current_streak_days : "—"}</span>
            <span className="text-xs font-normal text-dm-text-secondary font-sans">
              {overview?.current_streak_days === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="font-sans text-[11px] text-dm-text-secondary mt-2 flex items-center gap-1.5">
            <Award className="w-3 h-3 text-amber-500/80" />
            <span>Best record: <strong>{overview?.best_streak_days || 0}</strong> days</span>
          </div>
        </div>

        {/* Completed This Week */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
              This Week
            </span>
            <Calendar className="w-3.5 h-3.5 text-dm-accent" />
          </div>
          <div className="font-mono text-2xl font-bold text-dm-text-primary mt-1.5 leading-none">
            {overview ? overview.completed_this_week : "—"}
          </div>
          <div className="font-sans text-[11px] text-dm-text-secondary mt-2">
            Completed since Monday
          </div>
        </div>

        {/* Completed This Month */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
              This Month
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="font-mono text-2xl font-bold text-dm-text-primary mt-1.5 leading-none">
            {overview ? overview.completed_this_month : "—"}
          </div>
          <div className="font-sans text-[11px] text-dm-text-secondary mt-2">
            Total for current month
          </div>
        </div>
      </div>

      {/* Completion Trends Area Chart */}
      <div className="bg-dm-surface border border-dm-border rounded-[6px] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-sm font-semibold text-dm-text-primary flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-dm-accent" />
              Daily Completion Trend ({timeframe === "14d" ? "Past 14 Days" : "Past 30 Days"})
            </h3>
            <p className="font-sans text-xs text-dm-text-secondary mt-0.5">
              Daily volume of completed tasks logged to SQLite
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-dm-accent, #c2410c)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-dm-accent, #c2410c)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-dm-border/60" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="currentColor"
                className="text-dm-text-secondary text-[10px] font-mono"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="currentColor"
                className="text-dm-text-secondary text-[10px] font-mono"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-dm-surface border border-dm-border rounded-[4px] p-2 shadow-lg text-xs font-mono">
                        <div className="text-dm-text-secondary">{data.date}</div>
                        <div className="text-dm-text-primary font-bold mt-1">
                          {data.completed_count} {data.completed_count === 1 ? "task" : "tasks"} completed
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="completed_count"
                stroke="var(--color-dm-accent, #c2410c)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#completionGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Project Distribution & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Task Distribution */}
        <div className="bg-dm-surface border border-dm-border rounded-[6px] p-5 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="font-heading text-sm font-semibold text-dm-text-primary flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-dm-accent" />
              Project Breakdown
            </h3>
            <p className="font-sans text-xs text-dm-text-secondary mt-0.5">
              Task count and completion progress by project
            </p>
          </div>

          {projectChartData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-dm-text-secondary">
              <Layers className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-xs">No projects created yet</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {projectChartData.map((p, idx) => {
                const completionPct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="font-medium text-dm-text-primary flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className="font-mono text-dm-text-secondary shrink-0">
                        {p.completed}/{p.total} ({completionPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-dm-bg rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${completionPct}%`,
                          backgroundColor: p.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="bg-dm-surface border border-dm-border rounded-[6px] p-5 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="font-heading text-sm font-semibold text-dm-text-primary flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-dm-accent" />
              Priority Distribution
            </h3>
            <p className="font-sans text-xs text-dm-text-secondary mt-0.5">
              Volume and resolution status across priority tiers
            </p>
          </div>

          <div className="h-48 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-dm-border/60" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="currentColor"
                  className="text-dm-text-secondary text-[10px] font-mono"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="currentColor"
                  className="text-dm-text-secondary text-[10px] font-mono"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-dm-surface border border-dm-border rounded-[4px] p-2 shadow-lg text-xs font-mono">
                          <div className="font-bold text-dm-text-primary">{data.name} Priority</div>
                          <div className="text-dm-text-secondary mt-1">
                            Completed: {data.completed} / {data.total}
                          </div>
                          <div className="text-dm-text-secondary">
                            Pending: {data.pending}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" radius={[3, 3, 0, 0]}>
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
