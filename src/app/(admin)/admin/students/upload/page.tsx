"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface PreviewData {
  preview: boolean;
  totalRows: number;
  validRows: number;
  errors: { row: number; field: string; message: string }[];
  sample: {
    studentId: string;
    name: string;
    dateOfBirth: string;
    programme: string;
    year: number;
    mark: number;
    institution: string | null;
  }[];
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    totalRanked: number;
  } | null>(null);
  const [error, setError] = useState("");

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    setError("");
    setPreview(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/students/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }

    setPreview(data);
  }

  async function handleConfirm() {
    if (!file) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("confirm", "true");

    const res = await fetch("/api/students/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Import failed");
      return;
    }

    setResult(data);
  }

  if (result) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Import Complete</h1>
        <div className="mt-6 border border-[var(--border)] rounded-lg p-6">
          <p className="text-lg font-semibold text-green-700">
            Successfully imported students
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <p>Created: {result.created} new students</p>
            <p>Updated: {result.updated} existing students</p>
            <p>Total ranked: {result.totalRanked} students</p>
          </div>
          <button
            onClick={() => router.push("/admin/students")}
            className="mt-4 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md text-sm font-medium"
          >
            View Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Upload Student CSV</h1>
      <p className="text-[var(--muted-foreground)] mt-1">
        Import student records and academic marks from a CSV file.
      </p>

      <div className="mt-6 border border-[var(--border)] rounded-lg p-6">
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Expected CSV format:</p>
          <code className="text-xs bg-[var(--muted)] p-2 rounded block">
            student_id,first_name,last_name,date_of_birth,programme,year,institution,overall_mark,additional_score
          </code>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setPreview(null);
              setError("");
            }}
            className="text-sm"
          />
        </div>

        {error && (
          <p className="mt-3 text-sm text-[var(--destructive)]">{error}</p>
        )}

        {file && !preview && (
          <button
            onClick={handlePreview}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Processing..." : "Preview Import"}
          </button>
        )}

        {preview && (
          <div className="mt-4">
            <div className="flex gap-4 text-sm mb-4">
              <span>Total rows: {preview.totalRows}</span>
              <span className="text-green-700">
                Valid: {preview.validRows}
              </span>
              {preview.errors.length > 0 && (
                <span className="text-[var(--destructive)]">
                  Errors: {preview.errors.length}
                </span>
              )}
            </div>

            {preview.errors.length > 0 && (
              <div className="mb-4 border border-[var(--destructive)] rounded-lg p-3">
                <p className="text-sm font-medium text-[var(--destructive)] mb-2">
                  Validation Errors
                </p>
                {preview.errors.slice(0, 10).map((e, i) => (
                  <p key={i} className="text-xs text-[var(--muted-foreground)]">
                    Row {e.row}: {e.field} - {e.message}
                  </p>
                ))}
                {preview.errors.length > 10 && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    ...and {preview.errors.length - 10} more errors
                  </p>
                )}
              </div>
            )}

            {preview.sample.length > 0 && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-4">
                <table className="w-full text-xs">
                  <thead className="bg-[var(--muted)]">
                    <tr>
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">DOB</th>
                      <th className="text-left p-2">Programme</th>
                      <th className="text-left p-2">Mark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {preview.sample.map((s) => (
                      <tr key={s.studentId}>
                        <td className="p-2 font-mono">{s.studentId}</td>
                        <td className="p-2">{s.name}</td>
                        <td className="p-2">{s.dateOfBirth}</td>
                        <td className="p-2">{s.programme}</td>
                        <td className="p-2">{s.mark}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {preview.validRows > 0 && preview.errors.length === 0 && (
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md text-sm font-medium disabled:opacity-50"
              >
                {loading
                  ? "Importing..."
                  : `Confirm Import (${preview.validRows} students)`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
