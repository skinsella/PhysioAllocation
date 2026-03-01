"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./sortable-item";

export interface PlacementItem {
  id: string;
  hospitalName: string;
  speciality: string;
  city?: string | null;
  county?: string | null;
  capacity: number;
  supervisorName?: string | null;
}

interface PreferenceRankerProps {
  cycleId: string;
  placements: PlacementItem[];
  initialRanked: PlacementItem[];
  maxPreferences: number;
  deadline: string | null;
}

export function PreferenceRanker({
  cycleId,
  placements,
  initialRanked,
  maxPreferences,
  deadline,
}: PreferenceRankerProps) {
  const [ranked, setRanked] = useState<PlacementItem[]>(initialRanked);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rankedIds = new Set(ranked.map((r) => r.id));
  const available = placements.filter((p) => !rankedIds.has(p.id));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setRanked((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setSaved(false);
    },
    []
  );

  const addToRanked = useCallback(
    (placement: PlacementItem) => {
      if (ranked.length >= maxPreferences) {
        setError(`Maximum ${maxPreferences} preferences allowed`);
        return;
      }
      setRanked((prev) => [...prev, placement]);
      setSaved(false);
      setError(null);
    },
    [ranked.length, maxPreferences]
  );

  const removeFromRanked = useCallback((placementId: string) => {
    setRanked((prev) => prev.filter((p) => p.id !== placementId));
    setSaved(false);
    setError(null);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId,
          rankings: ranked.map((p, i) => ({
            placementId: p.id,
            rank: i + 1,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save preferences");
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deadlineDate = deadline ? new Date(deadline) : null;
  const isPastDeadline = deadlineDate ? new Date() > deadlineDate : false;

  return (
    <div className="space-y-4">
      {/* Deadline info */}
      {deadlineDate && (
        <div
          className={`px-4 py-2 rounded-lg text-sm ${
            isPastDeadline
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {isPastDeadline
            ? "The submission deadline has passed."
            : `Deadline: ${deadlineDate.toLocaleDateString("en-IE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}`}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available placements */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Available Placements ({available.length})
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {available.length === 0 ? (
              <div className="border border-dashed border-[var(--border)] rounded-lg p-6 text-center text-[var(--muted-foreground)] text-sm">
                All placements have been ranked.
              </div>
            ) : (
              available.map((p) => (
                <div
                  key={p.id}
                  className="border border-[var(--border)] rounded-lg p-3 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{p.hospitalName}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {p.speciality}
                      {p.city && ` · ${p.city}`}
                    </div>
                  </div>
                  <button
                    onClick={() => addToRanked(p)}
                    disabled={isPastDeadline || ranked.length >= maxPreferences}
                    className="shrink-0 px-2.5 py-1 text-xs font-medium rounded bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ranked preferences */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Your Rankings ({ranked.length}/{maxPreferences})
          </h2>
          {ranked.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-lg p-6 text-center text-[var(--muted-foreground)] text-sm">
              Add placements from the left to start ranking.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={ranked.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {ranked.map((p, index) => (
                    <SortableItem
                      key={p.id}
                      id={p.id}
                      rank={index + 1}
                      placement={p}
                      onRemove={() => removeFromRanked(p.id)}
                      disabled={isPastDeadline}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Save button */}
      {!isPastDeadline && (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || ranked.length === 0}
            className="px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">
              Preferences saved successfully!
            </span>
          )}
          {error && (
            <span className="text-sm text-red-600 font-medium">{error}</span>
          )}
        </div>
      )}
    </div>
  );
}
