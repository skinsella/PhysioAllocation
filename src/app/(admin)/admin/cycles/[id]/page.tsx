import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CycleStatusActions } from "./cycle-status-actions";
import { AddPlacementButton } from "./add-placement-button";

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700" },
  PREFERENCES_OPEN: { label: "Preferences Open", color: "bg-green-100 text-green-700" },
  PREFERENCES_CLOSED: { label: "Preferences Closed", color: "bg-yellow-100 text-yellow-700" },
  MATCHING_RUN: { label: "Matching Run", color: "bg-blue-100 text-blue-700" },
  RESULTS_PUBLISHED: { label: "Results Published", color: "bg-purple-100 text-purple-700" },
  ARCHIVED: { label: "Archived", color: "bg-gray-100 text-gray-500" },
};

export default async function CycleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cycle = await prisma.allocationCycle.findUnique({
    where: { id },
    include: {
      placements: {
        where: { active: true },
        include: { hospital: true },
        orderBy: [{ hospital: { name: "asc" } }, { speciality: "asc" }],
      },
      _count: { select: { preferences: true, allocations: true } },
    },
  });

  if (!cycle) notFound();

  const hospitals = await prisma.hospital.findMany({ orderBy: { name: "asc" } });
  const status = statusLabels[cycle.status];
  const totalCapacity = cycle.placements.reduce((s, p) => s + p.capacity, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{cycle.name}</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            {cycle.academicYear}
          </p>
        </div>
        <span
          className={`text-sm font-medium px-3 py-1.5 rounded-full ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      {/* Cycle stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="border border-[var(--border)] rounded-lg p-3">
          <p className="text-xs text-[var(--muted-foreground)]">Placements</p>
          <p className="text-xl font-bold">{cycle.placements.length}</p>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            Total Capacity
          </p>
          <p className="text-xl font-bold">{totalCapacity}</p>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            Preferences Submitted
          </p>
          <p className="text-xl font-bold">{cycle._count.preferences}</p>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-3">
          <p className="text-xs text-[var(--muted-foreground)]">Allocations</p>
          <p className="text-xl font-bold">{cycle._count.allocations}</p>
        </div>
      </div>

      {/* Configuration */}
      <div className="mt-6 border border-[var(--border)] rounded-lg p-4">
        <h2 className="font-semibold mb-3">Configuration</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[var(--muted-foreground)]">Tie-Break</p>
            <p className="font-medium">
              {cycle.tieBreakStrategy.replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <p className="text-[var(--muted-foreground)]">Max Preferences</p>
            <p className="font-medium">{cycle.maxPreferences}</p>
          </div>
          <div>
            <p className="text-[var(--muted-foreground)]">Preferences Open</p>
            <p className="font-medium">
              {cycle.preferencesOpenDate
                ? format(cycle.preferencesOpenDate, "dd MMM yyyy HH:mm")
                : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-[var(--muted-foreground)]">Preferences Close</p>
            <p className="font-medium">
              {cycle.preferencesCloseDate
                ? format(cycle.preferencesCloseDate, "dd MMM yyyy HH:mm")
                : "Not set"}
            </p>
          </div>
        </div>
      </div>

      {/* Status actions */}
      <CycleStatusActions cycleId={cycle.id} currentStatus={cycle.status} />

      {/* Placements */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Placements</h2>
          {cycle.status === "DRAFT" && (
            <AddPlacementButton
              cycleId={cycle.id}
              hospitals={hospitals.map((h) => ({ id: h.id, name: h.name }))}
            />
          )}
        </div>

        {cycle.placements.length === 0 ? (
          <div className="border border-[var(--border)] rounded-lg p-6 text-center text-[var(--muted-foreground)] text-sm">
            No placements added to this cycle yet.
          </div>
        ) : (
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="text-left p-3 font-medium">Hospital</th>
                  <th className="text-left p-3 font-medium">Speciality</th>
                  <th className="text-left p-3 font-medium">Capacity</th>
                  <th className="text-left p-3 font-medium">Dates</th>
                  <th className="text-left p-3 font-medium">Supervisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {cycle.placements.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3">{p.hospital.name}</td>
                    <td className="p-3">{p.speciality}</td>
                    <td className="p-3">{p.capacity}</td>
                    <td className="p-3 text-[var(--muted-foreground)]">
                      {format(p.startDate, "dd MMM")} -{" "}
                      {format(p.endDate, "dd MMM yyyy")}
                    </td>
                    <td className="p-3 text-[var(--muted-foreground)]">
                      {p.supervisorName ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
