import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const ZOOM_LEVELS = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2.0];
const DEFAULT_ZOOM = 1.0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const STORAGE_KEY = "daymark_zoom_level";
const ZOOM_SYNC_EVENT = "app-zoom-changed";

function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
  );
}

function getCurrentWindowLabel(): string | undefined {
  if (!isTauriRuntime()) return undefined;
  try {
    return getCurrentWebviewWindow().label;
  } catch {
    return undefined;
  }
}

function normalizeZoom(level: number): number {
  if (!Number.isFinite(level)) return DEFAULT_ZOOM;
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, level));
  return Math.round(clamped * 100) / 100;
}

function readSavedZoom(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= MIN_ZOOM && parsed <= MAX_ZOOM) {
        return normalizeZoom(parsed);
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_ZOOM;
}

async function applyLocalWebviewZoom(level: number): Promise<void> {
  let appliedViaTauri = false;
  try {
    if (isTauriRuntime()) {
      await getCurrentWebview().setZoom(level);
      appliedViaTauri = true;
    }
  } catch (err) {
    console.warn("Could not apply Tauri webview zoom, falling back to CSS zoom:", err);
  }

  if (!appliedViaTauri && typeof document !== "undefined") {
    document.documentElement.style.zoom = String(level);
  }
}

export function useZoom() {
  const [zoomLevel, setZoomLevel] = useState<number>(readSavedZoom);
  const zoomLevelRef = useRef<number>(zoomLevel);
  const [showIndicator, setShowIndicator] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  const showFeedbackIndicator = useCallback(() => {
    setShowIndicator(true);
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = window.setTimeout(() => {
      setShowIndicator(false);
    }, 1200);
  }, []);

  const applyZoom = useCallback(
    async (level: number, triggerIndicator = true, broadcast = true) => {
      const normalized = normalizeZoom(level);
      zoomLevelRef.current = normalized;
      setZoomLevel(normalized);

      try {
        localStorage.setItem(STORAGE_KEY, String(normalized));
      } catch {
        // Ignore storage errors
      }

      await applyLocalWebviewZoom(normalized);

      if (broadcast && isTauriRuntime()) {
        const sourceLabel = getCurrentWindowLabel();
        invoke("sync_app_zoom", { zoomLevel: normalized, sourceLabel }).catch((err) => {
          console.warn("Could not synchronize zoom across windows:", err);
        });
      }

      if (triggerIndicator) {
        showFeedbackIndicator();
      }
    },
    [showFeedbackIndicator]
  );

  // Apply initial saved zoom on mount and synchronize secondary windows
  useEffect(() => {
    const initial = readSavedZoom();
    zoomLevelRef.current = initial;
    setZoomLevel(initial);
    applyLocalWebviewZoom(initial);

    if (isTauriRuntime()) {
      const sourceLabel = getCurrentWindowLabel();
      if (sourceLabel === "main" || initial !== DEFAULT_ZOOM) {
        invoke("sync_app_zoom", { zoomLevel: initial, sourceLabel }).catch(() => {
          // Ignore sync failures if secondary window is unavailable
        });
      }
    }
  }, []);

  // Keep windows synchronized when zoom is adjusted from another window
  useEffect(() => {
    const syncIncomingZoom = (incoming: number) => {
      const normalized = normalizeZoom(incoming);
      if (Math.abs(normalized - zoomLevelRef.current) > 0.001) {
        zoomLevelRef.current = normalized;
        setZoomLevel(normalized);
        try {
          localStorage.setItem(STORAGE_KEY, String(normalized));
        } catch {
          // Ignore storage errors
        }
        applyLocalWebviewZoom(normalized);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        syncIncomingZoom(readSavedZoom());
      }
    };
    window.addEventListener("storage", handleStorage);

    let unlistenZoom: (() => void) | undefined;
    if (isTauriRuntime()) {
      listen<number>(ZOOM_SYNC_EVENT, (event) => {
        if (typeof event.payload === "number") {
          syncIncomingZoom(event.payload);
        }
      })
        .then((fn) => {
          unlistenZoom = fn;
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (unlistenZoom) unlistenZoom();
    };
  }, []);

  const zoomIn = useCallback(() => {
    const prev = zoomLevelRef.current;
    const next = ZOOM_LEVELS.find((l) => l > prev + 0.01) ?? ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
    applyZoom(next, true, true);
  }, [applyZoom]);

  const zoomOut = useCallback(() => {
    const prev = zoomLevelRef.current;
    const reversed = [...ZOOM_LEVELS].reverse();
    const next = reversed.find((l) => l < prev - 0.01) ?? ZOOM_LEVELS[0];
    applyZoom(next, true, true);
  }, [applyZoom]);

  const resetZoom = useCallback(() => {
    applyZoom(DEFAULT_ZOOM, true, true);
  }, [applyZoom]);

  // Global keyboard shortcuts and mouse wheel zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((!e.ctrlKey && !e.metaKey) || e.altKey) return;

      // Zoom In: Ctrl + Plus, Ctrl + Equal, Ctrl + NumpadAdd
      if (
        e.key === "+" ||
        e.key === "=" ||
        e.code === "Equal" ||
        e.code === "NumpadAdd"
      ) {
        e.preventDefault();
        e.stopPropagation();
        zoomIn();
      }
      // Zoom Out: Ctrl + Minus, Ctrl + Underscore, Ctrl + NumpadSubtract
      else if (
        e.key === "-" ||
        e.key === "_" ||
        e.code === "Minus" ||
        e.code === "NumpadSubtract"
      ) {
        e.preventDefault();
        e.stopPropagation();
        zoomOut();
      }
      // Reset: Ctrl + 0, Ctrl + Numpad0
      else if (e.key === "0" || e.code === "Digit0" || e.code === "Numpad0") {
        e.preventDefault();
        e.stopPropagation();
        resetZoom();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoomIn();
        } else if (e.deltaY > 0) {
          zoomOut();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("wheel", handleWheel);
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [zoomIn, zoomOut, resetZoom]);

  return {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    showIndicator,
    percentage: Math.round(zoomLevel * 100),
  };
}
