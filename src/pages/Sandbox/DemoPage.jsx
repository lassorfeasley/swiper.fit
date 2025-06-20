import React, { useState } from "react";
import { TextInput } from "@/components/molecules/text-input";
import { Eye } from "lucide-react";

export default function DemoPage() {
  const [focusedVal, setFocusedVal] = useState("Focused input");
  const [showIcon, setShowIcon] = useState(false);
  const [showLabel, setShowLabel] = useState(true);
  const [showOptional, setShowOptional] = useState(false);

  const iconElement = showIcon ? <Eye className="w-4 h-4 text-slate-500" /> : undefined;

  const maybeLabel = (text) => (showLabel ? text : undefined);

  return (
    <div className="p-8 space-y-6 max-w-sm mx-auto md:ml-64">
      {/* Switches */}
      <div className="flex items-center gap-6 mb-4 flex-wrap">
        <label className="flex items-center gap-2 text-slate-600 text-sm">
          <input
            type="checkbox"
            checked={showIcon}
            onChange={(e) => setShowIcon(e.target.checked)}
          />
          Icon
        </label>
        <label className="flex items-center gap-2 text-slate-600 text-sm">
          <input
            type="checkbox"
            checked={showLabel}
            onChange={(e) => setShowLabel(e.target.checked)}
          />
          Form label
        </label>
        <label className="flex items-center gap-2 text-slate-600 text-sm">
          <input
            type="checkbox"
            checked={showOptional}
            onChange={(e) => setShowOptional(e.target.checked)}
          />
          Optional
        </label>
      </div>

      {/* Default */}
      <TextInput label={maybeLabel("Default")} customPlaceholder="Default" icon={iconElement} optional={showOptional} />

      {/* Hover */}
      <TextInput label={maybeLabel("Hover me")} customPlaceholder="Hover" icon={iconElement} optional={showOptional} />

      {/* Focused */}
      <TextInput
        label={maybeLabel("Focused")}
        value={focusedVal}
        onChange={(e) => setFocusedVal(e.target.value)}
        autoFocus
        icon={iconElement}
        optional={showOptional}
      />

      {/* Disabled */}
      <TextInput
        label={maybeLabel("Disabled")}
        customPlaceholder="Disabled"
        disabled
        icon={iconElement}
        optional={showOptional}
      />

      {/* Error */}
      <TextInput
        label={maybeLabel("Error")}
        customPlaceholder="Error"
        error="This field is required"
        icon={iconElement}
        optional={showOptional}
      />
    </div>
  );
}