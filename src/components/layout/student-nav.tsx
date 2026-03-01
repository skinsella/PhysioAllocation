"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/placements", label: "Placements" },
  { href: "/preferences", label: "Preferences" },
  { href: "/results", label: "Results" },
  { href: "/profile", label: "Profile" },
];

export function StudentNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-sm">PhysioAllocation</span>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    pathname === item.href
                      ? "bg-[var(--accent)] font-medium"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--muted-foreground)]">
              {userName}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
