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
} from "lucide-react";
import { settingsService } from "../../services/settingsService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDark,
  onToggleTheme,
}) => {
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [isLoadingAutostart, setIsLoadingAutostart] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      settingsService.isAutostartEnabled().then(setAutostartEnabled);
    }
  }, [isOpen]);

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
    try {
      const nextState = !autostartEnabled;
      await settingsService.setAutostartEnabled(nextState);
      setAutostartEnabled(nextState);
      setStatusMessage(
        nextState
          ? "Autostart enabled for login sessions."
          : "Autostart disabled."
      );
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: unknown) {
      alert(`Could not toggle autostart: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoadingAutostart(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs select-none">
      <div className="bg-dm-surface border border-dm-border rounded-[8px] w-full max-w-lg shadow-2xl animate-in fade-in duration-150 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dm-border">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-dm-accent" />
            <h2 className="font-heading text-sm font-bold text-dm-text-primary tracking-tight">
              Settings & System
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-dm-text-secondary hover:text-dm-text-primary p-1 rounded-[4px] hover:bg-dm-bg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {statusMessage && (
            <div className="p-2.5 bg-dm-accent/10 border border-dm-accent/30 rounded-[4px] text-xs font-sans text-dm-accent flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{statusMessage}</span>
            </div>
          )}

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
