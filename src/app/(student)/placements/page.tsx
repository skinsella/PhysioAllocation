import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export default async function PlacementsPage() {
  const activeCycle = await prisma.allocationCycle.findFirst({
    where: {
      status: {
        in: [
          "PREFERENCES_OPEN",
          "PREFERENCES_CLOSED",
          "MATCHING_RUN",
          "RESULTS_PUBLISHED",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const placements = activeCycle
    ? await prisma.placement.findMany({
        where: { cycleId: activeCycle.id, active: true },
        include: { hospital: true },
        orderBy: [{ hospital: { name: "asc" } }, { speciality: "asc" }],
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Available Placements</h1>
      <p className="text-[var(--muted-foreground)] mt-1">
        {activeCycle
          ? `Placements for ${activeCycle.name}`
          : "Browse clinical placement sites for the current allocation cycle."}
      </p>

      {placements.length === 0 ? (
        <div className="mt-6 border border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
          {activeCycle
            ? "No placements have been added to this cycle yet."
            : "No active allocation cycle. Placements will appear when a cycle is opened."}
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {placements.map((p) => (
            <div
              key={p.id}
              className="border border-[var(--border)] rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{p.hospital.name}</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {p.hospital.city}
                    {p.hospital.county && `, ${p.hospital.county}`}
                  </p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  {p.speciality}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
                <span>
                  {format(p.startDate, "dd MMM")} -{" "}
                  {format(p.endDate, "dd MMM yyyy")}
                </span>
                <span>Capacity: {p.capacity}</span>
                {p.supervisorName && (
                  <span>Supervisor: {p.supervisorName}</span>
                )}
              </div>
              {p.description && (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {p.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
