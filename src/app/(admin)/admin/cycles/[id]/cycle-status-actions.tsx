"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statusTransitions: Record<string, { next: string; label: string; confirm?: string }[]> = {
  DRAFT: [
    { next: "PREFERENCES_OPEN", label: "Open Preferences", confirm: "Open preferences for students to submit?" },
  ],
  PREFERENCES_OPEN: [
    { next: "PREFERENCES_CLOSED", label: "Close Preferences", confirm: "Close preference submissions? Students will no longer be able to submit." },
  ],
  PREFERENCES_CLOSED: [
    { next: "PREFERENCES_OPEN", label: "Reopen Preferences" },
  ],
  MATCHING_RUN: [
    { next: "RESULTS_PUBLISHED", label: "Publish Results", confirm: "Publish results? Students will be able to see their allocations." },
  ],
  RESULTS_PUBLISHED: [
    { next: "MATCHING_RUN", label: "Unpublish Results" },
    { next: "ARCHIVED", label: "Archive Cycle", confirm: "Archive this cycle? It will be marked as historical." },
  ],
};

export function CycleStatusActions({
  cycleId,
  currentStatus,
}: {
  cycleId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const actions = statusTransitions[currentStatus] ?? [];
  if (actions.length === 0) return null;

  async function updateStatus(newStatus: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    setLoading(true);
    const res = await fetch(`/api/cycles/${cycleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="mt-4 flex gap-2">
      {actions.map((action) => (
        <button
          key={action.next}
          onClick={() => updateStatus(action.next, action.confirm)}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-md hover:bg-[var(--accent)] disabled:opacity-50"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
