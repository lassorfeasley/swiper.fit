import React, { useEffect, useMemo, useRef, useState } from "react";
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

// Convert seconds → "mmss" digits (e.g., 12:34 -> "1234", 0:05 -> "5")
function secondsToDigits(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "";
  const secs = Math.floor(totalSeconds);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return String(m * 100 + s);
}

// Convert "mmss" digits → seconds (normalize via formatting later)
function digitsToSeconds(digits) {
  if (!digits) return 0;
  const raw = String(digits).replace(/\D/g, "");
  const trimmed = raw.slice(-6); // allow up to HHMMSS
  const len = trimmed.length;
  const ss = len >= 2 ? parseInt(trimmed.slice(-2), 10) : parseInt(trimmed || "0", 10) || 0;
  const mm = len >= 4 ? parseInt(trimmed.slice(-4, -2), 10) : 0;
  const hh = len > 4 ? parseInt(trimmed.slice(0, len - 4), 10) : 0;
  return (hh * 3600) + (mm * 60) + ss;
}

// Format raw digits as mm:ss without normalizing (keeps seconds 00-99)
function formatDigitsForDisplay(digits) {
  const raw = (digits || "").replace(/\D/g, "");
  if (raw.length <= 4) {
    const four = raw.slice(-4).padStart(4, "0");
    const mm = four.slice(0, 2);
    const ss = four.slice(2, 4);
    return `${mm}:${ss}`;
  }
  const trimmed = raw.slice(-6); // up to HHMMSS
  const len = trimmed.length;
  const ss = trimmed.slice(-2);
  const mm = trimmed.slice(-4, -2);
  const hh = trimmed.slice(0, len - 4); // 1 or 2 digits depending on len
  // Do not show an hours section if it's zero; keep showing MM:SS
  if ((parseInt(hh, 10) || 0) === 0) {
    const four = trimmed.slice(-4);
    const mm2 = four.slice(0, 2);
    const ss2 = four.slice(2, 4);
    return `${mm2}:${ss2}`;
  }
  return `${hh}:${mm}:${ss}`;
}

function formatSecondsCommitted(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return "";
  const secs = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function DurationInput({
  value,
  onChange,
  step = 5,
  className = "",
  id,
  readOnly = false,
  incrementing = true,
  unitLabel,
  placeholder = "mm:ss",
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [text, setText] = useState(() => (Number.isFinite(value) ? formatSecondsCommitted(value) : ""));
  const [rawDigits, setRawDigits] = useState(() =>
    Number.isFinite(value) ? secondsToDigits(value) : ""
  );
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isFocused) {
      setText(Number.isFinite(value) ? formatSecondsCommitted(value) : "");
      setRawDigits(Number.isFinite(value) ? secondsToDigits(value) : "");
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

  const commitSeconds = (secs) => {
    const normalized = Math.max(0, Math.floor(secs));
    onChange?.(normalized);
    setText(formatSecondsCommitted(normalized));
    setRawDigits(secondsToDigits(normalized));
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (readOnly) return;
    const secs = digitsToSeconds(rawDigits);
    commitSeconds(secs);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Start a fresh microwave-style entry session
    setRawDigits("0000");
    setText("00:00");
    // Place caret at end after render
    setTimeout(() => {
      if (inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 0);
  };

  const handleTypingChange = (e) => {
    if (readOnly) return;
    const digits = (e.target.value || "").replace(/\D/g, "");
    // Use last up to 6 digits (HHMMSS); hours only appear when >4 digits typed
    const upToSix = digits.slice(-6);
    setRawDigits(upToSix);
    // Show raw time without normalization while typing
    setText(formatDigitsForDisplay(upToSix));
    // Propagate seconds immediately so Save can be clicked without blur
    const secs = digitsToSeconds(upToSix);
    onChange?.(secs);
    // Keep caret at end during typing
    setTimeout(() => {
      if (inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 0);
  };

  const dec = () => {
    if (readOnly) return;
    const cur = parseDurationToSeconds(text || formatToMMSS(value ?? 0));
    const next = Math.max(0, cur - step);
    commitSeconds(next);
  };

  const inc = () => {
    if (readOnly) return;
    const cur = parseDurationToSeconds(text || formatToMMSS(value ?? 0));
    const next = cur + step;
    commitSeconds(next);
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
            onChange={handleTypingChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            readOnly={readOnly}
            placeholder={placeholder}
            aria-label={unitLabel}
            className={inputCls}
            ref={inputRef}
          />
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


