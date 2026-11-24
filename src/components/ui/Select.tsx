import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  color?: string;
  badge?: React.ReactNode;
}

interface SelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  align?: "left" | "right";
  id?: string;
}

export function Select<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  triggerClassName = "",
  size = "md",
  disabled = false,
  align = "left",
  id,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const selectedOption = options.find((opt) => opt.value === value);

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

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listboxRef.current && highlightedIndex >= 0) {
      const activeElement = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeElement && typeof activeElement.scrollIntoView === "function") {
        activeElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
        onChange(options[highlightedIndex].value);
        setIsOpen(false);
      } else {
        setIsOpen((prev) => !prev);
        const idx = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const idx = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      } else {
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const idx = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(idx >= 0 ? idx : options.length - 1);
      } else {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : options.length - 1
        );
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (isOpen) {
        setIsOpen(false);
      }
    }
  };

  const isSmall = size === "sm";

  return (
    <div
      ref={containerRef}
      className={`relative text-left ${className || "inline-block"}`}
    >
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            const idx = options.findIndex((opt) => opt.value === value);
            setHighlightedIndex(idx >= 0 ? idx : 0);
          }
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 border rounded-[6px] font-sans text-dm-text-primary transition-colors cursor-pointer select-none focus:outline-none focus:border-dm-accent focus:ring-1 focus:ring-dm-accent disabled:opacity-50 disabled:cursor-not-allowed ${
          isSmall
            ? "px-2.5 py-1 text-xs bg-dm-surface border-dm-border"
            : "px-3 py-2 text-xs sm:text-sm bg-dm-bg border-dm-border"
        } ${
          isOpen
            ? "border-dm-accent ring-1 ring-dm-accent"
            : "hover:border-dm-border-hover"
        } ${triggerClassName}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.color && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-dm-text-secondary shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-dm-text-primary" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-1 min-w-full w-max max-w-xs bg-dm-surface border border-dm-border rounded-[6px] shadow-sm z-50 py-1 max-h-56 overflow-y-auto`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-dm-text-secondary italic">
              No options available
            </div>
          ) : (
            options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3 py-1.5 text-xs font-sans flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-dm-surface-hover font-semibold text-dm-accent"
                      : isHighlighted
                      ? "bg-dm-surface-hover text-dm-text-primary"
                      : "text-dm-text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.color && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-dm-accent shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
