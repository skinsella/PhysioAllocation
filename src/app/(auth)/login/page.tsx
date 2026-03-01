"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StudentLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const studentId = formData.get("studentId") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;

    const result = await signIn("student-login", {
      studentId,
      dateOfBirth,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid student ID or date of birth");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] shadow-sm p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Student Login</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Physiotherapy Placement Allocation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="studentId"
            className="block text-sm font-medium mb-1"
          >
            Student ID
          </label>
          <input
            id="studentId"
            name="studentId"
            type="text"
            required
            placeholder="e.g. 21012345"
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div>
          <label
            htmlFor="dateOfBirth"
            className="block text-sm font-medium mb-1"
          >
            Date of Birth
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            required
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        {error && (
          <p className="text-sm text-[var(--destructive)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <a
          href="/admin-login"
          className="text-sm text-[var(--primary)] hover:underline"
        >
          Administrator login
        </a>
      </div>
    </div>
  );
}
