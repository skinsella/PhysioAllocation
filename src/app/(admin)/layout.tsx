import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin-login");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar userName={session.user.name} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
