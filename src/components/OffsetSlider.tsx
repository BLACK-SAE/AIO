"use client";
import { useState } from "react";

export default function OffsetSlider({ name, defaultValue = 0, min = 0, max = 300 }: { name: string; defaultValue?: number; min?: number; max?: number }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input
          type="range"
          name={name}
          min={min}
          max={max}
          step={2}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="w-20">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full h-9 px-2 text-sm rounded-md border border-input bg-transparent text-right"
          />
        </div>
        <span className="text-xs text-muted-foreground w-6">pt</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Pushes document content downward to clear the letterhead. Increase if your letterhead is tall and overlaps the title.
      </p>
    </div>
  );
}
