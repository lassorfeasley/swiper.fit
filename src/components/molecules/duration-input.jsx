import React, { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

function formatToMMSS(totalSeconds) {
  if (totalSeconds == null || isNaN(totalSeconds)) return "";
  const secs = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const totalMinutes = h * 60 + m;
  return `${String(totalMinutes)}:${String(s).padStart(2, "0")}`;
}

function parseDurationToSeconds(input) {
  if (typeof input !== "string") return Number.isFinite(input) ? input : 0;
  const val = input.trim().toLowerCase();
  if (!val) return 0;

  // Accept "mm:ss" or "h:mm:ss"
  if (/^\d+:\d{1,2}$/.test(val)) {
    const [m, s] = val.split(":").map((n) => parseInt(n, 10));
    return (isNaN(m) ? 0 : m) * 60 + (isNaN(s) ? 0 : s);
  }
  if (/^\d+:\d{1,2}:\d{1,2}$/.test(val)) {
    const [h, m, s] = val.split(":").map((n) => parseInt(n, 10));
    return (isNaN(h) ? 0 : h) * 3600 + (isNaN(m) ? 0 : m) * 60 + (isNaN(s) ? 0 : s);
  }

  // Accept "1m30s", "90s", "2m"
  const mMatch = val.match(/(\d+)\s*m/);
  const sMatch = val.match(/(\d+)\s*s/);
  if (mMatch || sMatch) {
    const m = mMatch ? parseInt(mMatch[1], 10) : 0;
    const s = sMatch ? parseInt(sMatch[1], 10) : 0;
    return (isNaN(m) ? 0 : m) * 60 + (isNaN(s) ? 0 : s);
  }

  // Fallback: plain seconds
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export default function DurationInput({
  value,
  onChange,
  step = 5,
  className = "",
  id,
  readOnly = false,
  incrementing = true,
  unitLabel = "Duration (mm:ss)",
  placeholder = "mm:ss",
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [text, setText] = useState(() => (Number.isFinite(value) ? formatToMMSS(value) : ""));

  useEffect(() => {
    if (!isFocused) {
      setText(Number.isFinite(value) ? formatToMMSS(value) : "");
    }
  }, [value, isFocused]);

  const wrapperCls = useMemo(() => {
    const base = "self-stretch h-12 bg-white rounded-sm border border-neutral-300 flex justify-start items-center gap-0";
    if (readOnly) return cn(base, "border-neutral-300");
    if (isFocused || isHovered) return cn(base, "border-slate-600");
    return cn(base, "border-neutral-300");
  }, [isFocused, isHovered, readOnly]);

  const inputCls =
    "w-full text-center text-body bg-transparent border-none focus:outline-none focus:ring-0 " +
    (readOnly ? "text-neutral-300" : isFocused ? "text-slate-600" : "text-slate-500");

  const commitParsed = (raw) => {
    const secs = parseDurationToSeconds(raw);
    onChange?.(secs);
    setText(formatToMMSS(secs));
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (readOnly) return;
    commitParsed(text);
  };

  const dec = () => {
    if (readOnly) return;
    const cur = parseDurationToSeconds(text || formatToMMSS(value ?? 0));
    const next = Math.max(0, cur - step);
    onChange?.(next);
    setText(formatToMMSS(next));
  };

  const inc = () => {
    if (readOnly) return;
    const cur = parseDurationToSeconds(text || formatToMMSS(value ?? 0));
    const next = cur + step;
    onChange?.(next);
    setText(formatToMMSS(next));
  };

  return (
    <div className={cn("w-full inline-flex flex-col justify-start items-start gap-0", className)}>
      <div
        className={wrapperCls}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {incrementing && (
          <button
            type="button"
            onClick={dec}
            disabled={readOnly}
            className="flex-1 h-full flex justify-center items-center disabled:opacity-50 bg-transparent p-0 border-0 border-r border-neutral-300 first:rounded-l-sm"
            tabIndex={-1}
          >
            <Minus className="w-4 h-4 text-neutral-400" strokeWidth={2} />
          </button>
        )}
        <div className="flex-1 flex flex-col justify-center items-center">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onFocus={() => setIsFocused(true)}
            readOnly={readOnly}
            placeholder={placeholder}
            aria-label={unitLabel}
            className={inputCls}
          />
          {unitLabel && (
            <div className="text-center text-slate-500 text-label">{unitLabel}</div>
          )}
        </div>
        {incrementing && (
          <button
            type="button"
            onClick={inc}
            disabled={readOnly}
            className="flex-1 h-full flex justify-center items-center disabled:opacity-50 bg-transparent p-0 border-0 border-l border-neutral-300 last:rounded-r-sm"
            tabIndex={-1}
          >
            <Plus className="w-4 h-4 text-neutral-400" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}


