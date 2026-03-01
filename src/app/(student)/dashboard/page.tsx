import { auth } from "@/lib/auth";

export default async function StudentDashboard() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-[var(--muted-foreground)] mt-1">
        Welcome back, {session?.user?.name}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="border border-[var(--border)] rounded-lg p-4">
          <h2 className="text-sm font-medium text-[var(--muted-foreground)]">
            Current Cycle
          </h2>
          <p className="text-lg font-semibold mt-1">No active cycle</p>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-4">
          <h2 className="text-sm font-medium text-[var(--muted-foreground)]">
            Preferences
          </h2>
          <p className="text-lg font-semibold mt-1">Not submitted</p>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-4">
          <h2 className="text-sm font-medium text-[var(--muted-foreground)]">
            Allocation
          </h2>
          <p className="text-lg font-semibold mt-1">Pending</p>
        </div>
      </div>
    </div>
  );
}
