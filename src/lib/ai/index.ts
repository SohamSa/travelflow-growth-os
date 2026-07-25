import { DemoTravelCopilotProvider } from "@/lib/ai/demo-provider";
import {
  isOllamaReachable,
  ollamaHasModel,
  OllamaTravelCopilotProvider,
} from "@/lib/ai/ollama-provider";
import type {
  CopilotResult,
  CustomerContext,
  LeadContext,
  TravelCopilotProvider,
} from "@/lib/ai/types";

export type { CopilotResult, CustomerContext, LeadContext, TravelCopilotProvider };

export type AiMode = "auto" | "demo" | "ollama";

export interface ProviderSelection {
  provider: TravelCopilotProvider;
  modeLabel: "Ollama" | "Demo AI Mode";
  providerName: "ollama" | "demo";
}

export async function selectCopilotProvider(): Promise<ProviderSelection> {
  const mode = (process.env.AI_MODE ?? "auto").toLowerCase() as AiMode;
  const demo = new DemoTravelCopilotProvider();

  if (mode === "demo") {
    return { provider: demo, modeLabel: "Demo AI Mode", providerName: "demo" };
  }

  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "";

  if (mode === "ollama" || mode === "auto") {
    const reachable = await isOllamaReachable(baseUrl);
    if (reachable) {
      const hasModel = await ollamaHasModel(baseUrl, model);
      if (hasModel) {
        return {
          provider: new OllamaTravelCopilotProvider(model, baseUrl),
          modeLabel: "Ollama",
          providerName: "ollama",
        };
      }
    }
  }

  return { provider: demo, modeLabel: "Demo AI Mode", providerName: "demo" };
}

async function withFallback(
  selection: ProviderSelection,
  action: (provider: TravelCopilotProvider) => Promise<CopilotResult>,
): Promise<CopilotResult> {
  try {
    return await action(selection.provider);
  } catch {
    const demo = new DemoTravelCopilotProvider();
    // Recreate the same method via a second selection-like call site handled by caller.
    // Callers pass the concrete method; here we just return demo by re-invoking action on demo.
    return action(demo);
  }
}

export async function runCopilot<T extends CopilotResult>(
  action: (provider: TravelCopilotProvider) => Promise<T>,
): Promise<T & { modeLabel: "Ollama" | "Demo AI Mode" }> {
  const selection = await selectCopilotProvider();
  try {
    const result = await action(selection.provider);
    return { ...result, modeLabel: selection.modeLabel };
  } catch {
    const demo = new DemoTravelCopilotProvider();
    const result = await action(demo);
    return { ...result, modeLabel: "Demo AI Mode" };
  }
}

export { withFallback };
