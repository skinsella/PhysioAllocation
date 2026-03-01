"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const sidebarItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/cycles", label: "Allocation Cycles" },
  { href: "/admin/placements", label: "Placements" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/matching", label: "Matching" },
  { href: "/admin/results", label: "Results" },
  { href: "/admin/reports", label: "Reports" },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-[var(--border)] bg-[var(--background)] flex flex-col min-h-screen">
      <div className="p-4 border-b border-[var(--border)]">
        <h1 className="font-semibold text-sm">PhysioAllocation</h1>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
          Admin Panel
        </p>
      </div>

      <nav className="flex-1 p-2">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 text-sm rounded-md mb-0.5 transition-colors ${
              pathname.startsWith(item.href)
                ? "bg-[var(--accent)] font-medium"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border)]">
        <p className="text-sm font-medium truncate">{userName}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/admin-login" })}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-1 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
