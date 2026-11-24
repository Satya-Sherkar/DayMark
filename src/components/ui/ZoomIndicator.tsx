import React from "react";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

interface ZoomIndicatorProps {
  percentage: number;
  visible: boolean;
}

export const ZoomIndicator: React.FC<ZoomIndicatorProps> = ({ percentage, visible }) => {
  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 pointer-events-none flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-dm-surface border border-dm-border text-dm-text-primary text-xs font-mono shadow-md animate-in fade-in zoom-in-95 duration-100"
    >
      {percentage > 100 ? (
        <ZoomIn className="w-3.5 h-3.5 text-dm-accent" />
      ) : percentage < 100 ? (
        <ZoomOut className="w-3.5 h-3.5 text-dm-text-secondary" />
      ) : (
        <RefreshCw className="w-3.5 h-3.5 text-dm-text-secondary" />
      )}
      <span>{percentage}%</span>
    </div>
  );
};
