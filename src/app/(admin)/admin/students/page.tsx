import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminStudentsPage() {
  const students = await prisma.student.findMany({
    include: { user: true },
    orderBy: { academicRank: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            {students.length} students registered.
          </p>
        </div>
        <Link
          href="/admin/students/upload"
          className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md text-sm font-medium hover:opacity-90"
        >
          Upload CSV
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="mt-6 border border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
          No students imported yet. Upload a CSV to get started.
        </div>
      ) : (
        <div className="mt-6 border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="text-left p-3 font-medium">Rank</th>
                <th className="text-left p-3 font-medium">Student ID</th>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Programme</th>
                <th className="text-left p-3 font-medium">Year</th>
                <th className="text-left p-3 font-medium">Mark</th>
                <th className="text-left p-3 font-medium">Institution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--accent)]">
                  <td className="p-3 font-medium">
                    {s.academicRank ?? "-"}
                  </td>
                  <td className="p-3 font-mono">{s.studentId}</td>
                  <td className="p-3">{s.user.name}</td>
                  <td className="p-3 text-[var(--muted-foreground)]">
                    {s.programme}
                  </td>
                  <td className="p-3">{s.year}</td>
                  <td className="p-3">
                    {s.overallMark ? `${s.overallMark}%` : "-"}
                  </td>
                  <td className="p-3 text-[var(--muted-foreground)]">
                    {s.institution ?? "-"}
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
