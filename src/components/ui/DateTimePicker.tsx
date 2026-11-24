import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
} from "lucide-react";
import {
  format,
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isTomorrow,
  isValid,
} from "date-fns";

export interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm" format or ""
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  align?: "left" | "right" | "auto";
  direction?: "down" | "up" | "auto";
}

const toLocalIso = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  placeholder = "Set date & time...",
  disabled = false,
  className = "",
  align = "auto",
  direction = "auto",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date
  const currentDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isValid(d) ? d : null;
  }, [value]);

  // Current month being viewed in calendar
  const [viewMonth, setViewMonth] = useState<Date>(() => currentDate || new Date());

  // Update viewed month whenever value changes externally
  useEffect(() => {
    if (currentDate) {
      setViewMonth(currentDate);
    }
  }, [currentDate]);

  const checkPlacement = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const POPOVER_HEIGHT = 285;
    const POPOVER_WIDTH = 280;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Strongly prefer opening downwards.
    // Only open upward if explicitly requested, or if space below is genuinely cramped (< 180px)
    // AND space above can comfortably fit the popover without clipping the top of the window.
    if (direction === "up") {
      setOpenUpwards(true);
    } else if (direction === "down") {
      setOpenUpwards(false);
    } else {
      if (spaceBelow < 180 && spaceAbove >= POPOVER_HEIGHT + 20) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }

    if (align === "right") {
      setAlignRight(true);
    } else if (align === "left") {
      setAlignRight(false);
    } else {
      const overflowsRight = rect.left + POPOVER_WIDTH > window.innerWidth - 12;
      setAlignRight(overflowsRight);
    }
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      checkPlacement();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Quick Date Handlers
  const handleQuickToday = () => {
    const base = new Date();
    const h = currentDate ? currentDate.getHours() : 12;
    const m = currentDate ? currentDate.getMinutes() : 0;
    base.setHours(h, m, 0, 0);
    onChange(toLocalIso(base));
    setViewMonth(base);
  };

  const handleQuickTomorrow = () => {
    const base = addDays(new Date(), 1);
    const h = currentDate ? currentDate.getHours() : 12;
    const m = currentDate ? currentDate.getMinutes() : 0;
    base.setHours(h, m, 0, 0);
    onChange(toLocalIso(base));
    setViewMonth(base);
  };

  const handleQuickWeekend = () => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilSat = day === 6 ? 7 : (6 - day + 7) % 7;
    const base = addDays(now, daysUntilSat === 0 ? 7 : daysUntilSat);
    const h = currentDate ? currentDate.getHours() : 12;
    const m = currentDate ? currentDate.getMinutes() : 0;
    base.setHours(h, m, 0, 0);
    onChange(toLocalIso(base));
    setViewMonth(base);
  };

  const handleQuickNextWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilMon = (1 - day + 7) % 7 || 7;
    const base = addDays(now, daysUntilMon);
    const h = currentDate ? currentDate.getHours() : 12;
    const m = currentDate ? currentDate.getMinutes() : 0;
    base.setHours(h, m, 0, 0);
    onChange(toLocalIso(base));
    setViewMonth(base);
  };

  // Calendar Day Click
  const handleDayClick = (day: Date) => {
    const target = new Date(day);
    const h = currentDate ? currentDate.getHours() : 12;
    const m = currentDate ? currentDate.getMinutes() : 0;
    target.setHours(h, m, 0, 0);
    onChange(toLocalIso(target));
  };

  // Time components
  const currentHours = currentDate ? currentDate.getHours() : 12;
  const currentMinutes = currentDate ? currentDate.getMinutes() : 0;
  const ampm = currentHours >= 12 ? "PM" : "AM";
  const displayHours12 = currentHours % 12 === 0 ? 12 : currentHours % 12;

  const handleTimePreset = (h24: number, m: number) => {
    const base = currentDate ? new Date(currentDate) : new Date();
    base.setHours(h24, m, 0, 0);
    onChange(toLocalIso(base));
  };

  const handleHourChange = (newH12: number) => {
    const validH12 = Math.max(1, Math.min(12, isNaN(newH12) ? 12 : newH12));
    const h24 = ampm === "PM" ? (validH12 === 12 ? 12 : validH12 + 12) : (validH12 === 12 ? 0 : validH12);
    const base = currentDate ? new Date(currentDate) : new Date();
    base.setHours(h24, currentMinutes, 0, 0);
    onChange(toLocalIso(base));
  };

  const handleMinuteChange = (newM: number) => {
    const validM = Math.max(0, Math.min(59, isNaN(newM) ? 0 : newM));
    const base = currentDate ? new Date(currentDate) : new Date();
    base.setHours(currentHours, validM, 0, 0);
    onChange(toLocalIso(base));
  };

  const handleAmPmToggle = (targetPeriod: "AM" | "PM") => {
    if (ampm === targetPeriod) return;
    const h24 = targetPeriod === "PM" ? (currentHours % 12) + 12 : currentHours % 12;
    const base = currentDate ? new Date(currentDate) : new Date();
    base.setHours(h24, currentMinutes, 0, 0);
    onChange(toLocalIso(base));
  };

  const handleClear = () => {
    onChange("");
  };

  // Build calendar matrix
  const calendarDays = useMemo(() => {
    const mStart = startOfMonth(viewMonth);
    const mEnd = endOfMonth(mStart);
    const cStart = startOfWeek(mStart, { weekStartsOn: 1 });
    const cEnd = endOfWeek(mEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: cStart, end: cEnd });
  }, [viewMonth]);

  // Display text in trigger input
  const formattedDisplay = useMemo(() => {
    if (!currentDate) return "";
    try {
      if (isToday(currentDate)) {
        return `Today, ${format(currentDate, "h:mm a")}`;
      }
      if (isTomorrow(currentDate)) {
        return `Tomorrow, ${format(currentDate, "h:mm a")}`;
      }
      return format(currentDate, "MMM d, yyyy · h:mm a");
    } catch {
      return value;
    }
  }, [currentDate, value]);

  return (
    <div ref={containerRef} className={`relative text-left ${className || "w-full"}`}>
      {/* Trigger Button */}
      <div
        onClick={toggleOpen}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleOpen();
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-[6px] border border-dm-border bg-dm-bg text-dm-text-primary text-xs font-mono cursor-pointer transition-all ${
          isOpen ? "border-dm-accent ring-1 ring-dm-accent" : "hover:border-dm-text-secondary/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-2 truncate mr-1">
          <CalendarIcon className="w-3.5 h-3.5 text-dm-accent shrink-0" />
          {formattedDisplay ? (
            <span className="text-dm-text-primary truncate">{formattedDisplay}</span>
          ) : (
            <span className="text-dm-text-secondary font-sans truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-0.5 text-dm-text-secondary hover:text-dm-accent rounded transition-colors cursor-pointer"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-dm-text-secondary transition-transform duration-150 ${
              isOpen ? "rotate-180 text-dm-text-primary" : ""
            }`}
          />
        </div>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className={`absolute z-50 p-2.5 bg-dm-surface border border-dm-border rounded-[8px] shadow-2xl text-dm-text-primary w-[280px] animate-in fade-in zoom-in-95 duration-100 ${
            openUpwards ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${alignRight ? "right-0" : "left-0"}`}
        >
          {/* Quick Shortcuts */}
          <div className="grid grid-cols-4 gap-1 pb-2 mb-2 border-b border-dm-border">
            <button
              type="button"
              onClick={handleQuickToday}
              className="px-1 py-0.5 text-[10px] font-sans font-medium rounded-[4px] bg-dm-bg hover:bg-dm-border/40 text-dm-text-primary border border-dm-border/60 transition-colors cursor-pointer text-center"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleQuickTomorrow}
              className="px-1 py-0.5 text-[10px] font-sans font-medium rounded-[4px] bg-dm-bg hover:bg-dm-border/40 text-dm-text-primary border border-dm-border/60 transition-colors cursor-pointer text-center"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={handleQuickWeekend}
              className="px-1 py-0.5 text-[10px] font-sans font-medium rounded-[4px] bg-dm-bg hover:bg-dm-border/40 text-dm-text-primary border border-dm-border/60 transition-colors cursor-pointer text-center"
            >
              Weekend
            </button>
            <button
              type="button"
              onClick={handleQuickNextWeek}
              className="px-1 py-0.5 text-[10px] font-sans font-medium rounded-[4px] bg-dm-bg hover:bg-dm-border/40 text-dm-text-primary border border-dm-border/60 transition-colors cursor-pointer text-center"
            >
              Next Wk
            </button>
          </div>

          {/* Month & Year Navigation */}
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="font-heading text-xs font-bold text-dm-text-primary tracking-tight">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                className="p-1 text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-bg rounded-[4px] transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMonth(new Date())}
                className="px-1.5 py-0.5 text-[10px] font-mono text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-bg rounded-[4px] transition-colors cursor-pointer"
                title="Current month"
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                className="p-1 text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-bg rounded-[4px] transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday Labels (Mo - Su) */}
          <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <span
                key={d}
                className="font-mono text-[9px] font-semibold text-dm-text-secondary uppercase tracking-wider py-0.5"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {calendarDays.map((day) => {
              const inMonth = isSameMonth(day, viewMonth);
              const isSelected = !!currentDate && isSameDay(day, currentDate);
              const isDayToday = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`h-6 text-[11px] font-mono rounded-[3px] flex items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-dm-accent text-white font-semibold shadow-2xs"
                      : isDayToday
                      ? "border border-dm-accent/50 text-dm-accent font-bold hover:bg-dm-bg"
                      : inMonth
                      ? "text-dm-text-primary hover:bg-dm-bg"
                      : "text-dm-text-secondary/40 hover:bg-dm-bg hover:text-dm-text-secondary"
                  }`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Time & Action Section */}
          <div className="pt-2 mt-2 border-t border-dm-border space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-dm-text-secondary">
                <Clock className="w-3.5 h-3.5 text-dm-accent" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
                  Time
                </span>
              </div>

              {/* Quick Time Presets */}
              <div className="flex items-center gap-1">
                {[
                  { label: "9 AM", h: 9, m: 0 },
                  { label: "12 PM", h: 12, m: 0 },
                  { label: "5 PM", h: 17, m: 0 },
                  { label: "8 PM", h: 20, m: 0 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleTimePreset(item.h, item.m)}
                    className={`px-1.5 py-0.5 text-[9px] font-mono rounded-[3px] transition-colors cursor-pointer border ${
                      currentHours === item.h && currentMinutes === item.m
                        ? "bg-dm-accent text-white border-dm-accent font-semibold"
                        : "bg-dm-bg border-dm-border/60 text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-border/30"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Hour, Minute, AM/PM + Clear/Done in a single neat row */}
            <div className="flex items-center justify-between gap-1 pt-0.5">
              <div className="flex items-center gap-1 bg-dm-bg px-1.5 py-0.5 rounded-[4px] border border-dm-border">
                {/* Hour */}
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={displayHours12}
                  onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
                  className="w-7 text-center font-mono text-[11px] bg-dm-surface border border-dm-border rounded-[3px] py-0.5 text-dm-text-primary focus:outline-none focus:border-dm-accent"
                  title="Hour (1-12)"
                />

                <span className="font-mono text-xs text-dm-text-secondary font-bold">:</span>

                {/* Minute */}
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={String(currentMinutes).padStart(2, "0")}
                  onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
                  className="w-7 text-center font-mono text-[11px] bg-dm-surface border border-dm-border rounded-[3px] py-0.5 text-dm-text-primary focus:outline-none focus:border-dm-accent"
                  title="Minute (0-59)"
                />

                {/* AM / PM Segmented Control */}
                <div className="flex items-center rounded-[3px] border border-dm-border overflow-hidden ml-0.5">
                  <button
                    type="button"
                    onClick={() => handleAmPmToggle("AM")}
                    className={`px-1.5 py-0.5 text-[9px] font-mono font-semibold transition-colors cursor-pointer ${
                      ampm === "AM"
                        ? "bg-dm-accent text-white"
                        : "bg-dm-surface text-dm-text-secondary hover:text-dm-text-primary"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmPmToggle("PM")}
                    className={`px-1.5 py-0.5 text-[9px] font-mono font-semibold transition-colors cursor-pointer ${
                      ampm === "PM"
                        ? "bg-dm-accent text-white"
                        : "bg-dm-surface text-dm-text-secondary hover:text-dm-text-primary"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Clear & Done buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[10px] font-sans text-dm-text-secondary hover:text-dm-accent transition-colors cursor-pointer px-1 py-0.5"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-sans font-medium text-white bg-dm-accent hover:bg-dm-accent-hover rounded-[4px] transition-colors cursor-pointer shadow-2xs"
                >
                  <Check className="w-3 h-3" />
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
