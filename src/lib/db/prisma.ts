import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function bundledDemoPath() {
  return path.join(process.cwd(), "prisma", "demo.db");
}

function tmpDbPath() {
  return path.join("/tmp", "travelflow.db");
}

function shouldUseTmpDatabase() {
  return process.env.VERCEL === "1" || process.env.TRAVELFLOW_USE_TMP_DB === "1";
}

/**
 * On Vercel the filesystem is read-only except /tmp.
 * We ship a seeded prisma/demo.db and copy it into /tmp on cold start.
 */
export function ensureRuntimeDatabase(): string {
  if (!shouldUseTmpDatabase()) {
    return process.env.DATABASE_URL ?? "file:./dev.db";
  }

  const dest = tmpDbPath();
  const source = bundledDemoPath();

  if (!existsSync(dest)) {
    if (!existsSync(source)) {
      throw new Error(
        "Bundled demo database (prisma/demo.db) is missing from the deployment.",
      );
    }
    copyFileSync(source, dest);
  }

  const url = `file:${dest}`;
  process.env.DATABASE_URL = url;
  return url;
}

export function restoreDemoDatabaseSnapshot(): void {
  if (!shouldUseTmpDatabase()) {
    throw new Error("Snapshot restore is only available in the hosted demo environment.");
  }

  const dest = tmpDbPath();
  const source = bundledDemoPath();
  if (!existsSync(source)) {
    throw new Error("Bundled demo database (prisma/demo.db) is missing.");
  }
  copyFileSync(source, dest);
}

const databaseUrl = ensureRuntimeDatabase();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Disconnect, restore snapshot file, reconnect — for hosted demo reset. */
export async function reloadRuntimeDatabase() {
  await prisma.$disconnect();
  restoreDemoDatabaseSnapshot();
  await prisma.$connect();
}
