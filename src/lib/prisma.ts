import { PrismaClient } from "../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: parseInt(parsed.port || "5432"),
    database: parsed.pathname.slice(1),
    user: parsed.username || undefined,
    password: parsed.password || undefined,
    ssl: parsed.searchParams.get("sslmode") === "require" ? true : undefined,
  };
}

function createPrismaClient() {
  const pool = new pg.Pool(parseDatabaseUrl(process.env.DATABASE_URL!));
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Lazy initialization — avoid connecting at import/build time
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return Reflect.get(globalForPrisma.prisma, prop);
  },
});
