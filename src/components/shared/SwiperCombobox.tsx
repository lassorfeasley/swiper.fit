import React, { useMemo, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { Button as UiButton } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/shadcn/dropdown-menu";
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
}

/**
 * SwiperCombobox
 * A lightweight combobox built using our DropdownMenu primitives.
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
  width = 240,
  useRelativePositioning = false,
  disabled = false,
}: SwiperComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    return items.find((i) => i.value === value)?.label || "";
  }, [items, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      (i.label || String(i.value)).toLowerCase().includes(q)
    );
  }, [items, query]);

  // If using relative positioning, render a custom dropdown instead of using DropdownMenu
  if (useRelativePositioning) {
    return (
      <div className={cn("Combobox w-full inline-flex flex-col justify-start items-center gap-2 relative", className)}>
        <div
          role="combobox"
          aria-expanded={isOpen}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "Dropdown self-stretch h-11 px-3 bg-white rounded-lg border border-neutral-300 inline-flex justify-center items-center gap-2 cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed",
            triggerClassName
          )}
          style={{ width, maxWidth: width }}
        >
          <div className="DropdownText flex-1 justify-start text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight truncate">
            {selectedLabel || placeholder}
          </div>
          <div className="LucideIcon w-6 h-6 relative overflow-hidden">
            <ChevronDown className="w-4 h-4 text-neutral-700 absolute left-[4px] top-[4px]" />
          </div>
        </div>
        
        {isOpen && (
          <div
            className={cn("SearchBox self-stretch rounded-lg bg-white shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] p-0 absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden border border-neutral-300", contentClassName)}
            style={{ width, maxWidth: width }}
          >
            <div className="SearchArea self-stretch h-11 border-b border-neutral-300 bg-white">
              <div className="h-full px-2 flex items-center">
                <input
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
              <div className="SelectionArea self-stretch px-1 pt-1 flex flex-col justify-start items-start max-h-64 overflow-auto bg-white">
                {filtered.map((item) => {
                  const selected = value === item.value;
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
                        selected ? "bg-neutral-100" : "bg-white hover:bg-neutral-100",
                        item.disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex-1 justify-start text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight truncate">
                        {item.label || item.value}
                      </div>
                      <Check className={cn("ml-2 text-neutral-600", selected ? "opacity-100" : "opacity-0")}/>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Click outside to close */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
          />
        )}
      </div>
    );
  }

  // DropdownMenu implementation with proper state management
  return (
    <div className={cn("Combobox w-full inline-flex flex-col justify-start items-center gap-2", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <div
            role="combobox"
            aria-expanded={isOpen}
            className={cn(
              "Dropdown self-stretch h-11 px-3 bg-white rounded-lg border border-neutral-300 inline-flex justify-center items-center gap-2 cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed",
              triggerClassName
            )}
            style={{ width, maxWidth: width }}
          >
            <div className="DropdownText flex-1 justify-start text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight truncate">
              {selectedLabel || placeholder}
            </div>
            <div className="LucideIcon w-6 h-6 relative overflow-hidden">
              <ChevronDown className="w-4 h-4 text-neutral-700 absolute left-[4px] top-[4px]" />
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          sideOffset={6}
          className={cn("SearchBox self-stretch rounded-lg bg-white shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] p-0 border border-neutral-300", contentClassName)}
          style={{ width, maxWidth: width }}
        >
          <div className="SearchArea self-stretch h-11 border-b border-neutral-300 bg-white">
            <div className="h-full px-2 flex items-center">
              <input
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
            <div className="SelectionArea self-stretch px-1 pt-1 flex flex-col justify-start items-start max-h-64 overflow-auto bg-white">
              {filtered.map((item) => {
                const selected = value === item.value;
                return (
                  <DropdownMenuItem
                    key={item.value}
                    onSelect={() => {
                      onChange?.(item.value);
                      setQuery("");
                    }}
                    disabled={item.disabled}
                    className={cn(
                      "self-stretch h-9 p-2 rounded-lg inline-flex justify-center items-center gap-2.5 w-full",
                      selected ? "bg-neutral-100" : "bg-white hover:bg-neutral-100"
                    )}
                  >
                    <div className="flex-1 justify-start text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight truncate">
                      {item.label || item.value}
                    </div>
                    <Check className={cn("ml-2 text-neutral-600", selected ? "opacity-100" : "opacity-0")}/>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

