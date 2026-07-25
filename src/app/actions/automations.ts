"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { evaluateOverdueAutomations } from "@/lib/automation/engine";

export type ActionResult = { ok: boolean; message: string; actions?: number };

export async function toggleRule(formData: FormData): Promise<ActionResult> {
  const ruleId = String(formData.get("ruleId") ?? "");
  const enabled = formData.get("enabled") === "true";

  if (!ruleId) {
    return { ok: false, message: "Rule not found." };
  }

  await prisma.automationRule.update({
    where: { id: ruleId },
    data: { enabled: !enabled },
  });

  revalidatePath("/automations");
  return {
    ok: true,
    message: enabled ? "Automation disabled." : "Automation enabled.",
  };
}

export async function runEvaluation(): Promise<ActionResult> {
  const { actions } = await evaluateOverdueAutomations(prisma);
  revalidatePath("/automations");
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message:
      actions > 0
        ? `Evaluator completed ${actions} automation action${actions === 1 ? "" : "s"}.`
        : "Evaluator ran. No new actions were needed.",
    actions,
  };
}
