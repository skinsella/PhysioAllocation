import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

interface CSVRow {
  student_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  programme: string;
  year: string;
  institution?: string;
  overall_mark: string;
  additional_score?: string;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const confirm = formData.get("confirm") === "true";

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  const { data, errors } = Papa.parse<CSVRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (errors.length > 0) {
    return NextResponse.json(
      {
        error: "CSV parsing errors",
        details: errors.map((e) => ({
          row: e.row,
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  // Validate rows
  const validationErrors: { row: number; field: string; message: string }[] = [];
  const validRows: CSVRow[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2; // 1-indexed + header row

    if (!row.student_id?.trim()) {
      validationErrors.push({ row: rowNum, field: "student_id", message: "Required" });
      continue;
    }
    if (!row.first_name?.trim() && !row.last_name?.trim()) {
      validationErrors.push({ row: rowNum, field: "name", message: "Name required" });
      continue;
    }
    if (!row.date_of_birth?.trim()) {
      validationErrors.push({ row: rowNum, field: "date_of_birth", message: "Required" });
      continue;
    }
    const dob = new Date(row.date_of_birth.trim());
    if (isNaN(dob.getTime())) {
      validationErrors.push({ row: rowNum, field: "date_of_birth", message: "Invalid date" });
      continue;
    }
    if (!row.programme?.trim()) {
      validationErrors.push({ row: rowNum, field: "programme", message: "Required" });
      continue;
    }

    const mark = parseFloat(row.overall_mark);
    if (isNaN(mark) || mark < 0 || mark > 100) {
      validationErrors.push({
        row: rowNum,
        field: "overall_mark",
        message: "Must be a number between 0 and 100",
      });
      continue;
    }

    validRows.push(row);
  }

  // Preview mode - return parsed data without committing
  if (!confirm) {
    return NextResponse.json({
      preview: true,
      totalRows: data.length,
      validRows: validRows.length,
      errors: validationErrors,
      sample: validRows.slice(0, 10).map((r) => ({
        studentId: r.student_id.trim(),
        name: `${r.first_name?.trim() || ""} ${r.last_name?.trim() || ""}`.trim(),
        dateOfBirth: r.date_of_birth.trim(),
        programme: r.programme.trim(),
        year: parseInt(r.year) || 4,
        mark: parseFloat(r.overall_mark),
        institution: r.institution?.trim() || null,
      })),
    });
  }

  // Commit mode - upsert students
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: "Fix validation errors before confirming", errors: validationErrors },
      { status: 400 }
    );
  }

  let created = 0;
  let updated = 0;

  for (const row of validRows) {
    const studentId = row.student_id.trim();
    const name = `${row.first_name?.trim() || ""} ${row.last_name?.trim() || ""}`.trim();
    const email = `${studentId}@student.ul.ie`;

    const existingStudent = await prisma.student.findUnique({
      where: { studentId },
    });

    if (existingStudent) {
      await prisma.student.update({
        where: { studentId },
        data: {
          overallMark: parseFloat(row.overall_mark),
          additionalScore: row.additional_score
            ? parseFloat(row.additional_score)
            : null,
          programme: row.programme.trim(),
          year: parseInt(row.year) || 4,
          institution: row.institution?.trim() || null,
          user: { update: { name } },
        },
      });
      updated++;
    } else {
      const user = await prisma.user.create({
        data: {
          email,
          name,
          role: "STUDENT",
        },
      });
      await prisma.student.create({
        data: {
          userId: user.id,
          studentId,
          dateOfBirth: new Date(row.date_of_birth.trim()),
          programme: row.programme.trim(),
          year: parseInt(row.year) || 4,
          institution: row.institution?.trim() || null,
          overallMark: parseFloat(row.overall_mark),
          additionalScore: row.additional_score
            ? parseFloat(row.additional_score)
            : null,
        },
      });
      created++;
    }
  }

  // Recompute academic ranks (dense ranking by overallMark descending)
  const allStudents = await prisma.student.findMany({
    where: { overallMark: { not: null } },
    orderBy: { overallMark: "desc" },
  });

  let rank = 1;
  for (let i = 0; i < allStudents.length; i++) {
    if (
      i > 0 &&
      Number(allStudents[i].overallMark) < Number(allStudents[i - 1].overallMark)
    ) {
      rank = i + 1;
    }
    await prisma.student.update({
      where: { id: allStudents[i].id },
      data: { academicRank: rank },
    });
  }

  return NextResponse.json({
    success: true,
    created,
    updated,
    totalRanked: allStudents.length,
  });
}
