"use client";
import React from "react";
import { X } from "lucide-react";

type Props = {
  tags: string[];
  onRemove: (t: string) => void;
};

export default function TagChips({ tags, onRemove }: Props) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary/80 text-sm"
        >
          {t}
          <button
            className="p-0.5 rounded hover:bg-primary/20"
            onClick={() => onRemove(t)}
            aria-label={`Remove ${t}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
