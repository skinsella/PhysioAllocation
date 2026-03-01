import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.studentId) redirect("/login");

  const student = await prisma.student.findUnique({
    where: { studentId: session.user.studentId },
    include: { user: true },
  });

  if (!student) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-bold">My Profile</h1>
      <p className="text-[var(--muted-foreground)] mt-1">
        Your academic details and ranking information.
      </p>

      <div className="mt-6 border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
        <div className="p-4 flex justify-between">
          <span className="text-[var(--muted-foreground)]">Name</span>
          <span className="font-medium">{student.user.name}</span>
        </div>
        <div className="p-4 flex justify-between">
          <span className="text-[var(--muted-foreground)]">Student ID</span>
          <span className="font-medium">{student.studentId}</span>
        </div>
        <div className="p-4 flex justify-between">
          <span className="text-[var(--muted-foreground)]">Programme</span>
          <span className="font-medium">{student.programme}</span>
        </div>
        <div className="p-4 flex justify-between">
          <span className="text-[var(--muted-foreground)]">Year</span>
          <span className="font-medium">{student.year}</span>
        </div>
        <div className="p-4 flex justify-between">
          <span className="text-[var(--muted-foreground)]">Overall Mark</span>
          <span className="font-medium">
            {student.overallMark ? `${student.overallMark}%` : "Not available"}
          </span>
        </div>
        <div className="p-4 flex justify-between">
          <span className="text-[var(--muted-foreground)]">Academic Rank</span>
          <span className="font-medium">
            {student.academicRank ?? "Not ranked"}
          </span>
        </div>
        {student.institution && (
          <div className="p-4 flex justify-between">
            <span className="text-[var(--muted-foreground)]">Institution</span>
            <span className="font-medium">{student.institution}</span>
          </div>
        )}
      </div>
    </div>
  );
}
