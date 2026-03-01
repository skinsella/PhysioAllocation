import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  PreferenceRanker,
  type PlacementItem,
} from "@/components/preferences/preference-ranker";

export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
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

  // Find active cycle with preferences open
  const activeCycle = await prisma.allocationCycle.findFirst({
    where: { status: "PREFERENCES_OPEN" },
    orderBy: { createdAt: "desc" },
  });

  if (!activeCycle) {
    // Check if there's a cycle where preferences were already submitted
    const closedCycle = await prisma.allocationCycle.findFirst({
      where: {
        status: { in: ["PREFERENCES_CLOSED", "MATCHING_RUN", "RESULTS_PUBLISHED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (closedCycle) {
      const existingPrefs = await prisma.preference.findMany({
        where: { studentId: student.id, cycleId: closedCycle.id },
        include: { placement: { include: { hospital: true } } },
        orderBy: { rank: "asc" },
      });

      return (
        <div>
          <h1 className="text-2xl font-bold">My Preferences</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Preference submission is closed for {closedCycle.name}.
          </p>
          {existingPrefs.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3">
                Your Submitted Rankings
              </h2>
              <div className="space-y-2">
                {existingPrefs.map((pref) => (
                  <div
                    key={pref.id}
                    className="border border-[var(--border)] rounded-lg p-3 flex items-center gap-3"
                  >
                    <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold">
                      {pref.rank}
                    </span>
                    <div>
                      <div className="font-medium text-sm">
                        {pref.placement.hospital.name}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {pref.placement.speciality}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <h1 className="text-2xl font-bold">My Preferences</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Rank your preferred placement sites in order of preference.
        </p>
        <div className="mt-6 border border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
          Preference submission is not currently open.
        </div>
      </div>
    );
  }

  // Fetch placements and existing preferences
  const [placements, existingPreferences] = await Promise.all([
    prisma.placement.findMany({
      where: { cycleId: activeCycle.id, active: true },
      include: { hospital: true },
      orderBy: [{ hospital: { name: "asc" } }, { speciality: "asc" }],
    }),
    prisma.preference.findMany({
      where: { studentId: student.id, cycleId: activeCycle.id },
      include: { placement: { include: { hospital: true } } },
      orderBy: { rank: "asc" },
    }),
  ]);

  const placementItems: PlacementItem[] = placements.map((p) => ({
    id: p.id,
    hospitalName: p.hospital.name,
    speciality: p.speciality,
    city: p.hospital.city,
    county: p.hospital.county,
    capacity: p.capacity,
    supervisorName: p.supervisorName,
  }));

  const initialRanked: PlacementItem[] = existingPreferences.map((pref) => ({
    id: pref.placement.id,
    hospitalName: pref.placement.hospital.name,
    speciality: pref.placement.speciality,
    city: pref.placement.hospital.city,
    county: pref.placement.hospital.county,
    capacity: pref.placement.capacity,
    supervisorName: pref.placement.supervisorName,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold">My Preferences</h1>
      <p className="text-[var(--muted-foreground)] mt-1">
        Rank your preferred placement sites for {activeCycle.name}. Drag to
        reorder. You can rank up to {activeCycle.maxPreferences} placements.
      </p>

      <div className="mt-6">
        <PreferenceRanker
          cycleId={activeCycle.id}
          placements={placementItems}
          initialRanked={initialRanked}
          maxPreferences={activeCycle.maxPreferences}
          deadline={activeCycle.preferencesCloseDate?.toISOString() ?? null}
        />
      </div>
    </div>
  );
}
