"use client";
import { useState } from "react";
import { X } from "lucide-react";

export default function RemovableImage({ src, alt, removeName }: { src: string; alt: string; removeName: string }) {
  const [removed, setRemoved] = useState(false);

  if (removed) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <input type="hidden" name={removeName} value="1" />
        <span className="line-through">{alt}</span>
        <button
          type="button"
          onClick={() => setRemoved(false)}
          className="text-primary hover:underline"
        >
          undo
        </button>
        <span>(saves on submit)</span>
      </div>
    );
  }

  return (
    <div className="mt-2 inline-flex items-start gap-1 relative">
      <img src={src} alt={alt} className="h-20 border rounded p-1 bg-white" />
      <button
        type="button"
        onClick={() => setRemoved(true)}
        title={`Remove ${alt}`}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow hover:scale-110 transition-transform"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
