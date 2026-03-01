export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-[var(--muted-foreground)] mt-1">
        Placement analytics and allocation metrics.
      </p>
      <div className="mt-6 border border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
        Run a matching allocation to generate reports.
      </div>
    </div>
  );
}
