"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PublishButton({ cycleId }: { cycleId: string }) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/cycles/${cycleId}/publish`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to publish");
        return;
      }
      router.refresh();
    } catch {
      alert("Failed to publish results");
    } finally {
      setPublishing(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--muted-foreground)]">
          Publish results to students?
        </span>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {publishing ? "Publishing..." : "Confirm Publish"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--border)] hover:bg-[var(--accent)]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
    >
      Publish Results
    </button>
  );
}
