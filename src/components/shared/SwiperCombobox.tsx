import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  showItemsWithoutQuery?: boolean; // Show items even when query is empty
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
  showItemsWithoutQuery = false,
}: SwiperComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Find the appropriate portal container - either a Radix portal or document.body
  useEffect(() => {
    if (triggerRef.current) {
      // Look for nearest Radix portal container (to avoid inert attribute issues)
      let element: HTMLElement | null = triggerRef.current;
      while (element) {
        // Check for Radix portal data attribute
        if (element.hasAttribute('data-radix-portal')) {
          setPortalContainer(element);
          return;
        }
        // Also check for Vaul (drawer) portal
        if (element.hasAttribute('vaul-drawer')) {
          setPortalContainer(element.parentElement || document.body);
          return;
        }
        element = element.parentElement;
      }
      // Fallback to document.body if not in a modal
      setPortalContainer(document.body);
    }
  }, []);

  const selectedLabel = useMemo(() => {
    return items.find((i) => i.value === value)?.label || "";
  }, [items, value]);

  // Use displayValue only when no item is selected, otherwise use selectedLabel
  const displayText = selectedLabel || displayValue || placeholder;

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Use viewport-relative coordinates only (no scroll offset)
      // since we're using fixed positioning via portal
      // Gap of 12px between trigger and dropdown
      setDropdownPosition({
        top: rect.bottom + 12,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Initialize query and focus input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Initialize query with current display value (so user can edit their text)
      const initialText = selectedLabel || displayValue || "";
      if (initialText && initialText !== placeholder) {
        setQuery(initialText);
      }
      // Small delay to ensure portal has rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        // Place cursor at the end of the text
        const len = inputRef.current?.value.length || 0;
        inputRef.current?.setSelectionRange(len, len);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedLabel, displayValue, placeholder]);

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

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Check if click is outside both trigger and dropdown
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    // Use mousedown to catch clicks before they bubble
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const dropdownContent = isOpen && (query.trim() || (showItemsWithoutQuery && filtered.length > 0)) ? (
        <div
          ref={dropdownRef}
          className={cn("ResultsWrapper self-stretch fixed z-[9999]", contentClassName)}
          style={{ 
            top: dropdownPosition.top, 
            left: dropdownPosition.left, 
            width: dropdownPosition.width,
            maxWidth: 425,
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="SearchBox self-stretch rounded-lg shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] border border-neutral-300 backdrop-blur-[1px] flex flex-col justify-start items-center overflow-hidden bg-white" style={{ pointerEvents: 'auto' }}>
          {(() => {
            const regularItems = filtered.filter(item => !item.value.startsWith('__new__'));
            const addItems = filtered.filter(item => item.value.startsWith('__new__'));
            
            return (
              <>
                {regularItems.length > 0 && (
                  <div className="SelectionArea self-stretch max-h-48 p-2 flex flex-col justify-start items-start gap-1 overflow-hidden">
                    {regularItems.map((item) => {
                      const selected = value === item.value;
                      return (
                        <div
                          key={item.value}
                          onClick={() => {
                            if (item.disabled) return;
                            onChange?.(item.value);
                            setIsOpen(false);
                            setQuery("");
                          }}
                          className={cn(
                            "self-stretch px-2 py-4 rounded-sm inline-flex justify-center items-center gap-2.5 cursor-pointer",
                            selected ? "bg-neutral-100" : "bg-white hover:bg-neutral-100",
                            item.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex-1 justify-start text-neutral-600 text-sm font-semibold font-['Be_Vietnam_Pro'] leading-5">
                            {item.label || item.value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {addItems.length > 0 && query.trim() && (
                  <div className="Frame23 self-stretch bg-neutral-50 inline-flex justify-between items-center">
                    <div 
                      className="Frame24 w-full px-2 py-4 border-t border-neutral-300 flex justify-between items-center cursor-pointer hover:bg-neutral-100"
                      onClick={() => {
                        const addItem = addItems[0];
                        if (addItem) {
                          onChange?.(addItem.value);
                          setIsOpen(false);
                        }
                      }}
                    >
                      <div className="AddItemName justify-start text-neutral-700 text-sm font-semibold font-['Be_Vietnam_Pro'] leading-5">
                        Add {query.trim()}
                      </div>
                      <div className="LucideIcon size-6 relative overflow-hidden">
                        <Plus className="size-3.5 absolute left-[5px] top-[5px] text-neutral-700" strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
          </div>
        </div>
  ) : null;

  return (
    <div className={cn("Combobox w-full inline-flex flex-col justify-start items-center relative", className)}>
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "Dropdown self-stretch h-14 px-3 bg-white rounded-lg border border-neutral-300 inline-flex justify-center items-center gap-2 cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName
        )}
        style={width !== undefined ? { width, maxWidth: 425 } : {}}
      >
        {isOpen ? (
          <>
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  e.preventDefault();
                  // Check if there's an "add new" item available
                  const addItem = filtered.find(item => item.value.startsWith('__new__'));
                  if (addItem) {
                    onChange?.(addItem.value);
                  } else {
                    // If no add item exists, create one with the current query
                    onChange?.(`__new__${query.trim()}`);
                  }
                  setIsOpen(false);
                  setQuery("");
                }
              }}
              placeholder={filterPlaceholder}
              className="DropdownText flex-1 justify-start text-neutral-600 text-sm font-semibold font-['Be_Vietnam_Pro'] leading-5 bg-transparent border-none outline-none placeholder:text-neutral-400"
            />
            <div className="LucideIcon size-6 relative overflow-hidden">
              <Search className="size-4 absolute left-[3px] top-[3px] text-neutral-700" strokeWidth={2} />
            </div>
          </>
        ) : (
          <>
            <div className={cn(
              "DropdownText flex-1 justify-start text-sm font-semibold font-['Be_Vietnam_Pro'] leading-5 truncate",
              selectedLabel || displayValue ? "text-neutral-600" : "text-neutral-400"
            )}>
              {displayText}
            </div>
            <div className="LucideIcon size-6 relative overflow-hidden">
              <ChevronDown className="size-4 absolute left-[3px] top-[3px] text-neutral-700" strokeWidth={2} />
            </div>
          </>
        )}
      </div>
      
      {/* Portal the dropdown - use Radix portal container if inside a modal, otherwise document.body */}
      {dropdownContent && portalContainer && createPortal(dropdownContent, portalContainer)}
    </div>
  );
}

