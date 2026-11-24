import React, { useState, useEffect } from "react";
import {
  X,
  Settings,
  Cpu,
  Power,
  Command,
  Sun,
  Moon,
  ShieldCheck,
  Check,
  HardDrive,
  Download,
  Upload,
  Database,
  FileText,
  AlertTriangle,
  RefreshCw,
  Archive,
} from "lucide-react";
import { settingsService } from "../../services/settingsService";
import { backupService } from "../../services/backupService";
import { BackupFileInfo } from "../../types/backup";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onDataRestored?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDark,
  onToggleTheme,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "backup">("general");
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [isLoadingAutostart, setIsLoadingAutostart] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Backup State
  const [backupsList, setBackupsList] = useState<BackupFileInfo[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [mergeOnRestore, setMergeOnRestore] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      settingsService.isAutostartEnabled().then(setAutostartEnabled);
      loadBackupsList();
    }
  }, [isOpen]);

  const loadBackupsList = async () => {
    setIsLoadingBackups(true);
    try {
      const files = await backupService.listBackups();
      setBackupsList(files);
    } catch (err) {
      console.warn("Could not list local backups:", err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Support Esc key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleToggleAutostart = async () => {
    setIsLoadingAutostart(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const nextState = !autostartEnabled;
      await settingsService.setAutostartEnabled(nextState);
      setAutostartEnabled(nextState);
      setStatusMessage(
        nextState
          ? "Daymark autostart enabled for login sessions."
          : "Daymark autostart disabled."
      );
    } catch (err) {
      setErrorMessage(
        typeof err === "string" ? err : "Failed to toggle autostart setting."
      );
    } finally {
      setIsLoadingAutostart(false);
    }
  };

  const handleExportJson = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const savedPath = await backupService.promptAndExportBackupJson();
      if (savedPath) {
        setStatusMessage(`Backup exported successfully to ${savedPath}`);
        loadBackupsList();
      }
    } catch (err) {
      console.error("Export JSON error:", err);
      setErrorMessage(typeof err === "string" ? err : "Failed to export JSON backup");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreJson = async () => {
    const confirmed = window.confirm(
      mergeOnRestore
        ? "Restore backup and merge items into your workspace?"
        : "Restore backup and REPLACE all current tasks, projects, categories, and settings?"
    );
    if (!confirmed) return;

    setIsRestoring(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await backupService.promptAndImportBackupJson(mergeOnRestore);
      if (res) {
        setStatusMessage(
          `Restored successfully: ${res.tasks_restored} tasks, ${res.projects_restored} projects, ${res.categories_restored} categories.`
        );
        if (onDataRestored) onDataRestored();
        loadBackupsList();
      }
    } catch (err) {
      console.error("Restore error:", err);
      setErrorMessage(typeof err === "string" ? err : "Failed to restore backup");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRestoreFromHistory = async (file: BackupFileInfo) => {
    if (!file.file_name.endsWith(".json")) {
      alert("Only .json backups can be imported directly into the active session.");
      return;
    }

    const confirmed = window.confirm(
      `Restore backup "${file.file_name}"?\nMode: ${
        mergeOnRestore ? "Merge with current data" : "Replace all existing data"
      }`
    );
    if (!confirmed) return;

    setIsRestoring(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await backupService.importBackupJson(file.file_path, mergeOnRestore);
      setStatusMessage(
        `Restored from snapshot: ${res.tasks_restored} tasks, ${res.projects_restored} projects.`
      );
      if (onDataRestored) onDataRestored();
    } catch (err) {
      console.error("Restore error:", err);
      setErrorMessage(typeof err === "string" ? err : "Failed to restore snapshot");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExportSnapshot = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const savedPath = await backupService.promptAndExportDatabaseSnapshot();
      if (savedPath) {
        setStatusMessage(`SQLite database snapshot exported to ${savedPath}`);
        loadBackupsList();
      }
    } catch (err) {
      console.error("Snapshot export error:", err);
      setErrorMessage(typeof err === "string" ? err : "Failed to export SQLite snapshot");
    } finally {
      setIsExporting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-dm-surface border border-dm-border rounded-[8px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-100">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-dm-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-dm-accent" />
            <h2 className="font-heading text-sm font-semibold text-dm-text-primary tracking-tight">
              Settings & Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-dm-text-secondary hover:text-dm-text-primary p-1 rounded-[4px] hover:bg-dm-bg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 border-b border-dm-border flex gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab("general")}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeTab === "general"
                ? "text-dm-accent font-semibold"
                : "text-dm-text-secondary hover:text-dm-text-primary"
            }`}
          >
            General & System
            {activeTab === "general" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-dm-accent rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("backup")}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeTab === "backup"
                ? "text-dm-accent font-semibold"
                : "text-dm-text-secondary hover:text-dm-text-primary"
            }`}
          >
            Backup & Data
            {activeTab === "backup" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-dm-accent rounded-full" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {statusMessage && (
            <div className="p-2.5 bg-dm-accent/10 border border-dm-accent/30 rounded-[4px] text-xs font-sans text-dm-accent flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-[4px] text-xs font-sans text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === "general" ? (
            <>
              {/* 1. Linux Autostart */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
                  Startup & Background
                </label>
                <div className="p-3 bg-dm-bg border border-dm-border rounded-[6px] flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Power className="w-3.5 h-3.5 text-dm-accent" />
                      <span className="text-xs font-heading font-semibold text-dm-text-primary">
                        Launch Daymark at Startup
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-dm-text-secondary">
                      Automatically start Daymark in the GNOME system tray on user login.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAutostart}
                    disabled={isLoadingAutostart}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      autostartEnabled ? "bg-dm-accent" : "bg-dm-border"
                    } ${isLoadingAutostart ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        autostartEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Tray Residency Info */}
                <div className="p-3 bg-dm-bg border border-dm-border rounded-[6px] text-xs space-y-1">
                  <span className="font-mono text-[10px] text-dm-text-secondary uppercase tracking-wider font-semibold">
                    System Tray Residency
                  </span>
                  <p className="text-dm-text-secondary text-[11px] leading-relaxed">
                    Closing the window with the close button hides it to the system tray instead of terminating. Reminders, desktop notifications, and global hotkeys remain active in the background.
                  </p>
                </div>
              </div>

              {/* 2. Global Shortcuts */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
                  Global Shortcuts
                </label>
                <div className="p-3 bg-dm-bg border border-dm-border rounded-[6px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Command className="w-3.5 h-3.5 text-dm-accent" />
                    <span className="text-xs font-sans text-dm-text-primary">
                      Quick Add Task (Anywhere)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <kbd className="px-1.5 py-0.5 rounded bg-dm-surface border border-dm-border text-dm-text-primary text-[10px]">
                      Ctrl
                    </kbd>
                    <span className="text-dm-text-secondary">+</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-dm-surface border border-dm-border text-dm-text-primary text-[10px]">
                      Shift
                    </kbd>
                    <span className="text-dm-text-secondary">+</span>
                    <kbd className="px-2 py-0.5 rounded bg-dm-surface border border-dm-border text-dm-accent font-semibold text-[10px]">
                      Space
                    </kbd>
                  </div>
                </div>
              </div>

              {/* 3. Memory & Resource Efficiency */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
                  Resource & Memory Footprint
                </label>
                <div className="p-3 bg-dm-bg border border-dm-border rounded-[6px] space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-dm-text-secondary">
                      <HardDrive className="w-3 h-3 text-dm-accent" />
                      <span>SQLite Cache Limit</span>
                    </div>
                    <span className="text-dm-text-primary font-semibold">&lt; 2 MB (capped)</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-dm-text-secondary">
                      <Cpu className="w-3 h-3 text-dm-accent" />
                      <span>Scheduler Polling</span>
                    </div>
                    <span className="text-dm-text-primary font-semibold">15s loop + WAL auto-trim</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-dm-text-secondary">
                      <ShieldCheck className="w-3 h-3 text-dm-accent" />
                      <span>Cloud / Network Telemetry</span>
                    </div>
                    <span className="text-dm-accent font-semibold">0 KB (100% Offline)</span>
                  </div>
                </div>
              </div>

              {/* 4. Appearance */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
                  Appearance
                </label>
                <div className="p-3 bg-dm-bg border border-dm-border rounded-[6px] flex items-center justify-between">
                  <span className="text-xs font-sans text-dm-text-primary">
                    Current Interface Theme
                  </span>
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="flex items-center gap-1.5 px-3 py-1 bg-dm-surface hover:bg-dm-border/30 border border-dm-border rounded-[4px] text-xs font-sans text-dm-text-primary transition-colors cursor-pointer"
                  >
                    {isDark ? (
                      <>
                        <Moon className="w-3.5 h-3.5 text-dm-accent" />
                        <span>Dark Theme</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-3.5 h-3.5 text-dm-accent" />
                        <span>Light Theme</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Backup & Restore Tab */}
              <div className="space-y-4">
                {/* JSON Backup Actions */}
                <div className="space-y-2">
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
                    JSON Workspace Backup (Portable & Human-Readable)
                  </label>
                  <div className="p-3 bg-dm-bg border border-dm-border rounded-[6px] space-y-3">
                    <p className="text-[11px] font-sans text-dm-text-secondary leading-relaxed">
                      Exports all tasks, projects, categories, reminders, and settings into a standard JSON file that can be inspected, moved, or restored on any machine.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportJson}
                        disabled={isExporting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dm-surface hover:bg-dm-border/40 border border-dm-border rounded-[4px] text-xs font-sans font-medium text-dm-text-primary transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5 text-dm-accent" />
                        <span>Export JSON Backup</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRestoreJson}
                        disabled={isRestoring}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dm-surface hover:bg-dm-border/40 border border-dm-border rounded-[4px] text-xs font-sans font-medium text-dm-text-primary transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Restore from JSON...</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-dm-border/60">
                      <input
                        type="checkbox"
                        id="mergeToggle"
                        checked={mergeOnRestore}
                        onChange={(e) => setMergeOnRestore(e.target.checked)}
                        className="w-3.5 h-3.5 accent-dm-accent rounded cursor-pointer"
                      />
                      <label htmlFor="mergeToggle" className="text-[11px] font-sans text-dm-text-secondary cursor-pointer">
                        Merge into existing data (do not wipe current tasks)
                      </label>
                    </div>
                  </div>
                </div>

                {/* SQLite Snapshot */}
                <div className="space-y-2">
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
                    SQLite Database Snapshot (.db)
                  </label>
                  <div className="p-3 bg-dm-bg border border-dm-border rounded-[6px] space-y-2">
                    <p className="text-[11px] font-sans text-dm-text-secondary leading-relaxed">
                      Generates a defragmented, atomic live snapshot of the Daymark SQLite database using <code className="text-dm-text-primary font-mono">VACUUM INTO</code>. Directly usable with any SQLite CLI or GUI browser.
                    </p>

                    <button
                      type="button"
                      onClick={handleExportSnapshot}
                      disabled={isExporting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dm-surface hover:bg-dm-border/40 border border-dm-border rounded-[4px] text-xs font-sans font-medium text-dm-text-primary transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Database className="w-3.5 h-3.5 text-dm-accent" />
                      <span>Export SQLite Snapshot (.db)</span>
                    </button>
                  </div>
                </div>

                {/* Local Backup History */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary">
                      Local Snapshots Archive
                    </label>
                    <button
                      type="button"
                      onClick={loadBackupsList}
                      disabled={isLoadingBackups}
                      title="Refresh snapshot list"
                      className="p-1 text-dm-text-secondary hover:text-dm-text-primary transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  <div className="p-2 bg-dm-bg border border-dm-border rounded-[6px] max-h-40 overflow-y-auto divide-y divide-dm-border/60">
                    {backupsList.length === 0 ? (
                      <div className="p-4 text-center text-xs text-dm-text-secondary">
                        <Archive className="w-5 h-5 mx-auto mb-1 opacity-40" />
                        No snapshots in local application data folder yet.
                      </div>
                    ) : (
                      backupsList.map((file, i) => {
                        const isJson = file.file_name.endsWith(".json");
                        return (
                          <div key={i} className="py-2 px-1 flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-2 truncate">
                              {isJson ? (
                                <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              ) : (
                                <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              )}
                              <div className="truncate">
                                <p className="font-mono text-[11px] text-dm-text-primary truncate">
                                  {file.file_name}
                                </p>
                                <p className="text-[10px] text-dm-text-secondary font-mono">
                                  {formatFileSize(file.size_bytes)} • {new Date(file.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {isJson && (
                              <button
                                type="button"
                                onClick={() => handleRestoreFromHistory(file)}
                                disabled={isRestoring}
                                className="px-2 py-0.5 rounded bg-dm-surface hover:bg-dm-border/60 border border-dm-border text-[10px] font-mono text-dm-text-primary shrink-0 transition-colors cursor-pointer"
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-dm-border flex justify-end bg-dm-surface">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-sans font-medium text-white bg-dm-accent hover:bg-dm-accent-hover rounded-[6px] transition-colors cursor-pointer shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
