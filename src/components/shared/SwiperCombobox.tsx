import React, { useMemo, useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwiperComboboxProps {
  items: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  emptyText?: string;
  filterPlaceholder?: string;
  width?: number;
  useRelativePositioning?: boolean;
  onSearchChange?: (query: string) => void;
  disableClientFilter?: boolean;
  displayValue?: string; // Override display text when no item is selected
}

/**
 * SwiperCombobox
 * A lightweight combobox component.
 * - items: [{ value: string, label: string }]
 * - value: controlled selected value
 * - onChange: (value) => void
 */
export default function SwiperCombobox({
  items = [],
  value,
  onChange,
  placeholder = "Select…",
  className,
  triggerClassName,
  contentClassName,
  emptyText = "No results",
  filterPlaceholder = "Search…",
  width,
  useRelativePositioning = true,
  disabled = false,
  onSearchChange,
  disableClientFilter = false,
  displayValue,
}: SwiperComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedLabel = useMemo(() => {
    return items.find((i) => i.value === value)?.label || "";
  }, [items, value]);

  // Use displayValue only when no item is selected, otherwise use selectedLabel
  const displayText = selectedLabel || displayValue || placeholder;

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Focus input when dropdown opens (autoFocus doesn't work reliably in portals)
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure portal has rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (disableClientFilter) return items;
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      (i.label || String(i.value)).toLowerCase().includes(q)
    );
  }, [items, query, disableClientFilter]);

  // Notify parent of search changes for async search
  useEffect(() => {
    onSearchChange?.(query);
  }, [query, onSearchChange]);

  const dropdownContent = isOpen ? (
    <>
      {/* Click outside to close */}
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={() => {
          setIsOpen(false);
          setQuery("");
        }}
      />
      <div
        className={cn("SearchBox rounded-lg bg-white shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] p-0 fixed z-[9999] overflow-hidden border border-neutral-300", contentClassName)}
        style={{ 
          top: dropdownPosition.top, 
          left: dropdownPosition.left, 
          width: dropdownPosition.width,
          maxWidth: 425 
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="SearchArea self-stretch h-11 border-b border-neutral-300 bg-white">
          <div className="h-full px-2 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={filterPlaceholder}
              className="SearchRoutines flex-1 text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight bg-transparent border-none outline-none placeholder:text-neutral-600"
            />
            <div className="LucideIcon w-4 h-4 relative overflow-hidden ml-2">
              <Search className="w-3.5 h-3.5 absolute left-[1px] top-[1px] text-neutral-500" strokeWidth={2} />
            </div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-neutral-400 bg-white">{emptyText}</div>
        ) : (
          <div className="SelectionArea self-stretch px-1 pt-1 pb-1 flex flex-col justify-start items-start max-h-64 overflow-auto bg-white">
            {filtered.map((item, index) => {
              const selected = value === item.value;
              const isAddItem = item.value.startsWith('__new__');
              const isLastItem = index === filtered.length - 1;
              return (
                <div
                  key={item.value}
                  onClick={() => {
                    onChange?.(item.value);
                    setIsOpen(false);
                    setQuery("");
                  }}
                    className={cn(
                    "self-stretch h-9 p-2 rounded-lg inline-flex justify-center items-center gap-2.5 w-full cursor-pointer",
                    selected ? "bg-stone-100" : "bg-white hover:bg-stone-100",
                    item.disabled && "opacity-50 cursor-not-allowed",
                    isAddItem && isLastItem && "border-t border-neutral-200 mt-1 pt-3"
                  )}
                >
                  <div className={cn(
                    "flex-1 justify-start text-sm font-['Be_Vietnam_Pro'] leading-tight truncate",
                    isAddItem ? "text-blue-600 font-medium" : "text-neutral-600 font-normal"
                  )}>
                    {item.label || item.value}
                  </div>
                  {isAddItem ? (
                    <Plus className="w-4 h-4 text-neutral-600" />
                  ) : (
                    <Check className={cn("ml-2 text-neutral-600", selected ? "opacity-100" : "opacity-0")} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  ) : null;

  return (
    <div className={cn("Combobox w-full inline-flex flex-col justify-start items-center gap-2 relative", className)}>
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "Dropdown self-stretch h-11 px-3 bg-white rounded-lg border border-neutral-300 inline-flex justify-center items-center gap-2 cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName
        )}
        style={width !== undefined ? { width, maxWidth: 425 } : {}}
      >
        <div className="DropdownText flex-1 justify-start text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight truncate">
          {displayText}
        </div>
        <div className="LucideIcon w-6 h-6 relative overflow-hidden">
          <ChevronDown className="w-4 h-4 text-neutral-700 absolute left-[4px] top-[4px]" />
        </div>
      </div>
      
      {dropdownContent}
    </div>
  );
}

