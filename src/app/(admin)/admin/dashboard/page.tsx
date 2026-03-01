import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await auth();

  const [studentCount, placementCount, cycleCount] = await Promise.all([
    prisma.student.count(),
    prisma.placement.count(),
    prisma.allocationCycle.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-[var(--muted-foreground)] mt-1">
        Welcome back, {session?.user?.name}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="border border-[var(--border)] rounded-lg p-4">
          <h2 className="text-sm font-medium text-[var(--muted-foreground)]">
            Total Students
          </h2>
          <p className="text-3xl font-bold mt-1">{studentCount}</p>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-4">
          <h2 className="text-sm font-medium text-[var(--muted-foreground)]">
            Total Placements
          </h2>
          <p className="text-3xl font-bold mt-1">{placementCount}</p>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-4">
          <h2 className="text-sm font-medium text-[var(--muted-foreground)]">
            Allocation Cycles
          </h2>
          <p className="text-3xl font-bold mt-1">{cycleCount}</p>
        </div>
      </div>
    </div>
  );
}
