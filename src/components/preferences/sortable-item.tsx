"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PlacementItem } from "./preference-ranker";

interface SortableItemProps {
  id: string;
  rank: number;
  placement: PlacementItem;
  onRemove: () => void;
  disabled: boolean;
}

export function SortableItem({
  id,
  rank,
  placement,
  onRemove,
  disabled,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-3 flex items-center gap-3 bg-[var(--card)] ${
        isDragging ? "shadow-lg border-[var(--primary)]" : "border-[var(--border)]"
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-[var(--muted-foreground)] hover:text-[var(--foreground)] touch-none"
        aria-label={`Drag to reorder ${placement.hospitalName}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </div>

      {/* Rank number */}
      <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold">
        {rank}
      </span>

      {/* Placement info */}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate">
          {placement.hospitalName}
        </div>
        <div className="text-xs text-[var(--muted-foreground)] truncate">
          {placement.speciality}
          {placement.city && ` · ${placement.city}`}
        </div>
      </div>

      {/* Remove button */}
      {!disabled && (
        <button
          onClick={onRemove}
          className="shrink-0 p-1 text-[var(--muted-foreground)] hover:text-red-600 rounded"
          aria-label={`Remove ${placement.hospitalName}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </div>
  );
}
