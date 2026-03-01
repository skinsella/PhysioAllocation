-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN', 'COORDINATOR', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('DRAFT', 'PREFERENCES_OPEN', 'PREFERENCES_CLOSED', 'MATCHING_RUN', 'RESULTS_PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MatchingStatus" AS ENUM ('PENDING', 'SIMULATION', 'FINAL', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "TieBreakStrategy" AS ENUM ('RANDOM_SEED', 'INSTITUTION_PRIORITY', 'ADDITIONAL_SCORE', 'ALPHABETICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "programme" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "institution" TEXT,
    "overallMark" DECIMAL(5,2),
    "academicRank" INTEGER,
    "additionalScore" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "county" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coordinator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,

    CONSTRAINT "Coordinator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Placement" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "speciality" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "supervisorName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationCycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'DRAFT',
    "preferencesOpenDate" TIMESTAMP(3),
    "preferencesCloseDate" TIMESTAMP(3),
    "tieBreakStrategy" "TieBreakStrategy" NOT NULL DEFAULT 'RANDOM_SEED',
    "randomSeed" INTEGER,
    "maxPreferences" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllocationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingRun" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "status" "MatchingStatus" NOT NULL DEFAULT 'PENDING',
    "isSimulation" BOOLEAN NOT NULL DEFAULT false,
    "randomSeed" INTEGER,
    "tieBreakStrategy" "TieBreakStrategy" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "totalStudents" INTEGER,
    "totalPlacements" INTEGER,
    "totalAllocated" INTEGER,
    "totalUnallocated" INTEGER,
    "configSnapshot" JSONB,
    "algorithmLog" JSONB,

    CONSTRAINT "MatchingRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "matchingRunId" TEXT NOT NULL,
    "preferenceRank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE INDEX "Student_studentId_idx" ON "Student"("studentId");

-- CreateIndex
CREATE INDEX "Student_academicRank_idx" ON "Student"("academicRank");

-- CreateIndex
CREATE UNIQUE INDEX "Coordinator_userId_key" ON "Coordinator"("userId");

-- CreateIndex
CREATE INDEX "Coordinator_hospitalId_idx" ON "Coordinator"("hospitalId");

-- CreateIndex
CREATE INDEX "Placement_cycleId_idx" ON "Placement"("cycleId");

-- CreateIndex
CREATE INDEX "Placement_hospitalId_idx" ON "Placement"("hospitalId");

-- CreateIndex
CREATE INDEX "Placement_speciality_idx" ON "Placement"("speciality");

-- CreateIndex
CREATE INDEX "AllocationCycle_status_idx" ON "AllocationCycle"("status");

-- CreateIndex
CREATE INDEX "AllocationCycle_academicYear_idx" ON "AllocationCycle"("academicYear");

-- CreateIndex
CREATE INDEX "Preference_cycleId_idx" ON "Preference"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_studentId_placementId_cycleId_key" ON "Preference"("studentId", "placementId", "cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_studentId_rank_cycleId_key" ON "Preference"("studentId", "rank", "cycleId");

-- CreateIndex
CREATE INDEX "MatchingRun_cycleId_idx" ON "MatchingRun"("cycleId");

-- CreateIndex
CREATE INDEX "MatchingRun_status_idx" ON "MatchingRun"("status");

-- CreateIndex
CREATE INDEX "Allocation_cycleId_idx" ON "Allocation"("cycleId");

-- CreateIndex
CREATE INDEX "Allocation_matchingRunId_idx" ON "Allocation"("matchingRunId");

-- CreateIndex
CREATE INDEX "Allocation_placementId_idx" ON "Allocation"("placementId");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_studentId_cycleId_matchingRunId_key" ON "Allocation"("studentId", "cycleId", "matchingRunId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coordinator" ADD CONSTRAINT "Coordinator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coordinator" ADD CONSTRAINT "Coordinator_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AllocationCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AllocationCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchingRun" ADD CONSTRAINT "MatchingRun_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AllocationCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AllocationCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_matchingRunId_fkey" FOREIGN KEY ("matchingRunId") REFERENCES "MatchingRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
