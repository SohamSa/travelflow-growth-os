"use server";

import { execSync } from "node:child_process";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export type DemoResetResult = { ok: boolean; message: string };

export async function resetDemoData(): Promise<DemoResetResult> {
  try {
    await prisma.$transaction([
      prisma.copilotDraft.deleteMany(),
      prisma.automationRun.deleteMany(),
      prisma.activity.deleteMany(),
      prisma.task.deleteMany(),
      prisma.booking.deleteMany(),
      prisma.quote.deleteMany(),
      prisma.lead.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.campaign.deleteMany(),
      prisma.automationRule.deleteMany(),
    ]);

    execSync("npx tsx prisma/seed.ts", {
      cwd: process.cwd(),
      stdio: "pipe",
      env: process.env,
    });

    revalidatePath("/", "layout");

    return {
      ok: true,
      message:
        "Demo data reset complete. All records were cleared and re-seeded from the Horizon Trails Travel dataset.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset failed.";
    return {
      ok: false,
      message: `Demo reset failed: ${message}. You can also run npm run db:reset locally.`,
    };
  }
}
