"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddPlacementButton({
  cycleId,
  hospitals,
}: {
  cycleId: string;
  hospitals: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      cycleId,
      hospitalId: formData.get("hospitalId"),
      speciality: formData.get("speciality"),
      capacity: Number(formData.get("capacity")),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      supervisorName: formData.get("supervisorName") || undefined,
      description: formData.get("description") || undefined,
    };

    const res = await fetch("/api/placements", {
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
        className="px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md text-sm font-medium hover:opacity-90"
      >
        Add Placement
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Add Placement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Hospital</label>
            <select
              name="hospitalId"
              required
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
            >
              <option value="">Select hospital...</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Speciality
            </label>
            <select
              name="speciality"
              required
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
            >
              <option value="">Select speciality...</option>
              <option value="Musculoskeletal">Musculoskeletal</option>
              <option value="Respiratory">Respiratory</option>
              <option value="Neurology">Neurology</option>
              <option value="Paediatrics">Paediatrics</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Orthopaedics">Orthopaedics</option>
              <option value="Geriatrics">Geriatrics</option>
              <option value="Community">Community</option>
              <option value="Mental Health">Mental Health</option>
              <option value="Oncology">Oncology</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input
              name="capacity"
              type="number"
              min={1}
              required
              defaultValue={2}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                name="startDate"
                type="date"
                required
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End Date
              </label>
              <input
                name="endDate"
                type="date"
                required
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Supervisor Name
            </label>
            <input
              name="supervisorName"
              placeholder="Optional"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Optional notes about this placement"
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
              {loading ? "Adding..." : "Add Placement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
