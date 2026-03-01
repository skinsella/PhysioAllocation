import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export default async function StudentResultsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const student = await prisma.student.findUnique({
    where: { studentId: session.user.studentId! },
  });

  if (!student) {
    redirect("/login");
  }

  // Find published cycle
  const publishedCycle = await prisma.allocationCycle.findFirst({
    where: { status: "RESULTS_PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedCycle) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Allocation Results</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Your placement allocation will appear here once results are published.
        </p>
        <div className="mt-6 border border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
          Results have not been published yet. Check back later.
        </div>
      </div>
    );
  }

  // Find the student's allocation for this cycle
  const allocation = await prisma.allocation.findFirst({
    where: {
      studentId: student.id,
      cycleId: publishedCycle.id,
      matchingRun: { isSimulation: false },
    },
    include: {
      placement: { include: { hospital: true } },
    },
  });

  // Get their preferences for context
  const preferences = await prisma.preference.findMany({
    where: { studentId: student.id, cycleId: publishedCycle.id },
    include: { placement: { include: { hospital: true } } },
    orderBy: { rank: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Allocation Results</h1>
      <p className="text-[var(--muted-foreground)] mt-1">
        {publishedCycle.name} — Your Placement Result
      </p>

      {allocation ? (
        <div className="mt-6 space-y-6">
          {/* Main allocation card */}
          <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
            <div className="text-sm font-medium text-green-700 mb-1">
              You have been allocated to
            </div>
            <h2 className="text-xl font-bold text-green-900">
              {allocation.placement.hospital.name}
            </h2>
            <p className="text-green-700 mt-1">
              {allocation.placement.speciality}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-green-700">
              <span>
                {format(allocation.placement.startDate, "dd MMM")} —{" "}
                {format(allocation.placement.endDate, "dd MMM yyyy")}
              </span>
              {allocation.placement.hospital.city && (
                <span>
                  {allocation.placement.hospital.city}
                  {allocation.placement.hospital.county &&
                    `, ${allocation.placement.hospital.county}`}
                </span>
              )}
              {allocation.placement.supervisorName && (
                <span>
                  Supervisor: {allocation.placement.supervisorName}
                </span>
              )}
            </div>
            {allocation.preferenceRank && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                <span className="text-sm font-medium text-green-800">
                  This was your #{allocation.preferenceRank} choice
                </span>
              </div>
            )}
          </div>

          {/* Placement details */}
          {allocation.placement.description && (
            <div className="border border-[var(--border)] rounded-lg p-4">
              <h3 className="font-medium mb-2">Placement Details</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {allocation.placement.description}
              </p>
            </div>
          )}

          {/* Hospital contact */}
          {(allocation.placement.hospital.contactName ||
            allocation.placement.hospital.contactEmail) && (
            <div className="border border-[var(--border)] rounded-lg p-4">
              <h3 className="font-medium mb-2">Hospital Contact</h3>
              <div className="space-y-1 text-sm text-[var(--muted-foreground)]">
                {allocation.placement.hospital.contactName && (
                  <p>{allocation.placement.hospital.contactName}</p>
                )}
                {allocation.placement.hospital.contactEmail && (
                  <p>{allocation.placement.hospital.contactEmail}</p>
                )}
                {allocation.placement.hospital.contactPhone && (
                  <p>{allocation.placement.hospital.contactPhone}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 border-2 border-orange-300 bg-orange-50 rounded-lg p-6">
          <div className="text-sm font-medium text-orange-700 mb-1">
            Allocation Result
          </div>
          <h2 className="text-lg font-bold text-orange-900">
            You were not allocated a placement in this cycle.
          </h2>
          <p className="text-sm text-orange-700 mt-2">
            Please contact the programme coordinator for further information
            about your placement options.
          </p>
        </div>
      )}

      {/* Preference list for context */}
      {preferences.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-3">Your Submitted Preferences</h3>
          <div className="space-y-2">
            {preferences.map((pref) => {
              const isAllocated = allocation?.placementId === pref.placementId;
              return (
                <div
                  key={pref.id}
                  className={`border rounded-lg p-3 flex items-center gap-3 ${
                    isAllocated
                      ? "border-green-300 bg-green-50"
                      : "border-[var(--border)]"
                  }`}
                >
                  <span
                    className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                      isAllocated
                        ? "bg-green-600 text-white"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    {pref.rank}
                  </span>
                  <div>
                    <div
                      className={`font-medium text-sm ${
                        isAllocated ? "text-green-900" : ""
                      }`}
                    >
                      {pref.placement.hospital.name}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {pref.placement.speciality}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
