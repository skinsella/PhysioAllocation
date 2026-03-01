import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminPlacementsPage() {
  const placements = await prisma.placement.findMany({
    where: { active: true },
    include: { hospital: true, cycle: true },
    orderBy: [{ cycle: { createdAt: "desc" } }, { hospital: { name: "asc" } }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Placements</h1>
      <p className="text-[var(--muted-foreground)] mt-1">
        All placement sites across cycles. Manage placements from within each
        cycle.
      </p>

      {placements.length === 0 ? (
        <div className="mt-6 border border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
          No placements created yet.
        </div>
      ) : (
        <div className="mt-6 border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="text-left p-3 font-medium">Hospital</th>
                <th className="text-left p-3 font-medium">Speciality</th>
                <th className="text-left p-3 font-medium">Capacity</th>
                <th className="text-left p-3 font-medium">Dates</th>
                <th className="text-left p-3 font-medium">Cycle</th>
                <th className="text-left p-3 font-medium">Supervisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {placements.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--accent)]">
                  <td className="p-3 font-medium">{p.hospital.name}</td>
                  <td className="p-3">{p.speciality}</td>
                  <td className="p-3">{p.capacity}</td>
                  <td className="p-3 text-[var(--muted-foreground)]">
                    {format(p.startDate, "dd MMM")} -{" "}
                    {format(p.endDate, "dd MMM yyyy")}
                  </td>
                  <td className="p-3 text-[var(--muted-foreground)]">
                    {p.cycle.name}
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
  );
}
