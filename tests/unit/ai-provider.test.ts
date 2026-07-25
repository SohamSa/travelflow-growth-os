import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoTravelCopilotProvider } from "@/lib/ai/demo-provider";
import { selectCopilotProvider } from "@/lib/ai/index";

const baseLead = {
  leadId: "lead-1",
  firstName: "Maya",
  lastName: "Patel",
  email: "maya.patel.0@example.com",
  destination: "Italy",
  travelStartDate: new Date("2026-09-10"),
  travelEndDate: new Date("2026-09-16"),
  travelerCount: 2,
  estimatedBudget: 8500,
  tripType: "ROMANTIC" as const,
  interests: ["culture", "local food", "moderate luxury"],
  specialRequests: "Anniversary trip",
  source: "INSTAGRAM" as const,
  stage: "CONTACTED" as const,
  score: 80,
  assignedConsultant: "Avery Chen",
  isReturning: false,
};

describe("AI provider selection and demo fallback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("personalizes demo drafts with traveler context", async () => {
    const provider = new DemoTravelCopilotProvider();
    const summary = await provider.summarizeInquiry(baseLead);
    expect(summary.provider).toBe("demo");
    expect(summary.modeLabel).toBe("Demo AI Mode");
    expect(summary.content).toContain("Maya");
    expect(summary.content).toContain("Italy");
    expect(summary.content).toContain("Draft for employee review");
  });

  it("falls back to demo when Ollama is unreachable", async () => {
    vi.stubEnv("AI_MODE", "auto");
    vi.stubEnv("OLLAMA_MODEL", "llama3.2");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connection refused");
      }),
    );

    const selection = await selectCopilotProvider();
    expect(selection.providerName).toBe("demo");
    expect(selection.modeLabel).toBe("Demo AI Mode");
  });

  it("forces demo mode when AI_MODE=demo", async () => {
    vi.stubEnv("AI_MODE", "demo");
    const selection = await selectCopilotProvider();
    expect(selection.providerName).toBe("demo");
  });
});
