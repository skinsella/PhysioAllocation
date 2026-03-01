import { auth } from "@/lib/auth";
import { StudentNav } from "@/components/layout/student-nav";
import { redirect } from "next/navigation";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <StudentNav userName={session.user.name} />
      <main className="max-w-7xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
