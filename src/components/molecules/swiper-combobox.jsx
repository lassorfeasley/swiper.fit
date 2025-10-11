import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ChevronsUpDown, Check, Search } from "lucide-react";
import { Button as UiButton } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
}) {
  const [query, setQuery] = useState("");

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

  return (
    <div className={cn("Combobox w-full inline-flex flex-col justify-start items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            role="combobox"
            aria-expanded={undefined}
            className={cn(
              "Dropdown self-stretch h-11 px-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex justify-center items-center gap-2 cursor-pointer",
              triggerClassName
            )}
            style={{ width, maxWidth: width }}
          >
            <div className="DropdownText flex-1 justify-start text-neutral-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight truncate">
              {selectedLabel || placeholder}
            </div>
            <div className="LucideIcon w-6 h-6 relative overflow-hidden">
              <ChevronsUpDown className="w-4 h-4 text-neutral-neutral-700 absolute left-[4px] top-[4px]" />
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          sideOffset={6}
          className={cn("SearchBox self-stretch rounded-lg bg-white shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] p-0", contentClassName)}
          style={{ width, maxWidth: width, border: "1px solid rgba(212, 212, 212, 1)" }}
        >
          <div className="SearchArea self-stretch h-11 px-0 border-b border-neutral-neutral-300 inline-flex items-center bg-white">
            <div className="w-full px-2 inline-flex justify-start items-center gap-2">
              <div className="LucideIcon w-4 h-4 relative overflow-hidden">
                <Search className="w-3 h-3 absolute left-[2px] top-[2px] text-neutral-neutral-500" strokeWidth={2} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={filterPlaceholder}
                className="flex-1 bg-transparent border-none outline-none text-neutral-neutral-600 placeholder:text-neutral-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight"
              />
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
                    onSelect={() => onChange?.(item.value)}
                    className={cn(
                      "self-stretch h-9 p-2 rounded-lg inline-flex justify-center items-center gap-2.5 w-full",
                      selected ? "bg-neutral-neutral-100" : "bg-white hover:bg-neutral-neutral-100"
                    )}
                  >
                    <div className="flex-1 justify-start text-neutral-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight truncate">
                      {item.label || item.value}
                    </div>
                    <Check className={cn("ml-2 text-neutral-neutral-600", selected ? "opacity-100" : "opacity-0")}/>
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

SwiperCombobox.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string })
  ),
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  triggerClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  emptyText: PropTypes.string,
  filterPlaceholder: PropTypes.string,
  width: PropTypes.number,
};


