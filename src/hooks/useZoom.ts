import { useState, useEffect, useCallback, useRef } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

const ZOOM_LEVELS = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2.0];
const DEFAULT_ZOOM = 1.0;
const STORAGE_KEY = "daymark_zoom_level";

export function useZoom() {
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 3.0) {
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_ZOOM;
  });

  const [showIndicator, setShowIndicator] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  const applyZoom = useCallback(async (level: number, triggerIndicator = true) => {
    const normalized = Math.round(level * 100) / 100;
    setZoomLevel(normalized);

    try {
      localStorage.setItem(STORAGE_KEY, String(normalized));
    } catch {
      // Ignore storage errors
    }

    let appliedViaTauri = false;
    try {
      const isTauri = typeof window !== "undefined" && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
      if (isTauri) {
        await getCurrentWebview().setZoom(normalized);
        appliedViaTauri = true;
      }
    } catch (err) {
      console.warn("Could not apply Tauri webview zoom, falling back to CSS zoom:", err);
    }

    if (!appliedViaTauri && typeof document !== "undefined") {
      document.documentElement.style.zoom = String(normalized);
    }

    if (triggerIndicator) {
      setShowIndicator(true);
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = window.setTimeout(() => {
        setShowIndicator(false);
      }, 1200);
    }
  }, []);

  // Apply initial saved zoom on mount
  useEffect(() => {
    if (zoomLevel !== DEFAULT_ZOOM) {
      applyZoom(zoomLevel, false);
    }
  }, [applyZoom]);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => {
      const next = ZOOM_LEVELS.find((l) => l > prev + 0.01) ?? ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
      applyZoom(next, true);
      return next;
    });
  }, [applyZoom]);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const reversed = [...ZOOM_LEVELS].reverse();
      const next = reversed.find((l) => l < prev - 0.01) ?? ZOOM_LEVELS[0];
      applyZoom(next, true);
      return next;
    });
  }, [applyZoom]);

  const resetZoom = useCallback(() => {
    applyZoom(DEFAULT_ZOOM, true);
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
