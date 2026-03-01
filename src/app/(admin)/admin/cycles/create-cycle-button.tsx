"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateCycleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name"),
      academicYear: formData.get("academicYear"),
      tieBreakStrategy: formData.get("tieBreakStrategy"),
      maxPreferences: Number(formData.get("maxPreferences")),
      randomSeed: formData.get("randomSeed")
        ? Number(formData.get("randomSeed"))
        : undefined,
      preferencesOpenDate: formData.get("preferencesOpenDate") || undefined,
      preferencesCloseDate: formData.get("preferencesCloseDate") || undefined,
    };

    const res = await fetch("/api/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md text-sm font-medium hover:opacity-90"
      >
        New Cycle
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Create Allocation Cycle</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Cycle Name
            </label>
            <input
              name="name"
              required
              placeholder="e.g. 2025-26 Semester 2 Clinical Placement"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Academic Year
            </label>
            <input
              name="academicYear"
              required
              placeholder="e.g. 2025-2026"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Preferences Open
              </label>
              <input
                name="preferencesOpenDate"
                type="datetime-local"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Preferences Close
              </label>
              <input
                name="preferencesCloseDate"
                type="datetime-local"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tie-Break Strategy
              </label>
              <select
                name="tieBreakStrategy"
                defaultValue="RANDOM_SEED"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
              >
                <option value="RANDOM_SEED">Random (Seeded)</option>
                <option value="INSTITUTION_PRIORITY">
                  Institution Priority
                </option>
                <option value="ADDITIONAL_SCORE">Additional Score</option>
                <option value="ALPHABETICAL">Alphabetical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Preferences
              </label>
              <input
                name="maxPreferences"
                type="number"
                defaultValue={10}
                min={1}
                max={50}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Random Seed (optional)
            </label>
            <input
              name="randomSeed"
              type="number"
              placeholder="e.g. 42"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--accent)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Cycle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
