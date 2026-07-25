import type {
  CopilotResult,
  CustomerContext,
  LeadContext,
  TravelCopilotProvider,
} from "@/lib/ai/types";
import { SOURCE_LABELS, TRIP_TYPE_LABELS } from "@/types";

const DEFAULT_TIMEOUT_MS = 8000;

function systemPreamble(): string {
  return [
    "You are a drafting assistant for Horizon Trails Travel consultants.",
    "All availability and pricing are fictional placeholders.",
    "Never confirm live availability, guarantee prices, book travel, process payments, or make legal/visa/medical guarantees.",
    "Never invent personal facts beyond the provided traveler context.",
    "Clearly state the output is a draft for employee review and must not be sent without human approval.",
    "Write in a warm, professional travel-consulting tone.",
  ].join(" ");
}

function leadPrompt(input: LeadContext, task: string): string {
  return [
    systemPreamble(),
    `Task: ${task}`,
    `Traveler: ${input.firstName} ${input.lastName}`,
    `Email: ${input.email}`,
    `Destination: ${input.destination}`,
    `Dates: ${input.travelStartDate?.toISOString() ?? "n/a"} to ${input.travelEndDate?.toISOString() ?? "n/a"}`,
    `Travelers: ${input.travelerCount}`,
    `Budget: ${input.estimatedBudget ?? "n/a"}`,
    `Trip type: ${TRIP_TYPE_LABELS[input.tripType]}`,
    `Interests: ${input.interests.join(", ") || "n/a"}`,
    `Special requests: ${input.specialRequests || "n/a"}`,
    `Source: ${SOURCE_LABELS[input.source]}`,
    `Stage: ${input.stage}`,
    `Score: ${input.score}`,
    `Consultant: ${input.assignedConsultant}`,
    `Returning: ${input.isReturning ? "yes" : "no"}`,
  ].join("\n");
}

async function generate(model: string, baseUrl: string, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.4 },
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Ollama responded with ${response.status}`);
    }
    const data = (await response.json()) as { response?: string };
    if (!data.response?.trim()) {
      throw new Error("Empty Ollama response");
    }
    return data.response.trim();
  } finally {
    clearTimeout(timer);
  }
}

function wrapOllama(content: string): CopilotResult {
  return {
    content: `${content}\n\n— Draft for employee review. Do not send without human approval.`,
    provider: "ollama",
    label: "Draft for employee review",
    modeLabel: "Ollama",
  };
}

export class OllamaTravelCopilotProvider implements TravelCopilotProvider {
  constructor(
    private readonly model: string,
    private readonly baseUrl: string,
  ) {}

  private async run(input: LeadContext, task: string): Promise<CopilotResult> {
    const content = await generate(this.model, this.baseUrl, leadPrompt(input, task));
    return wrapOllama(content);
  }

  summarizeInquiry(input: LeadContext) {
    return this.run(input, "Write a concise inquiry summary for the consultant.");
  }

  recommendNextAction(input: LeadContext) {
    return this.run(input, "Recommend the single best next action for the consultant.");
  }

  draftInitialResponse(input: LeadContext) {
    return this.run(input, "Draft an initial customer response email.");
  }

  draftItinerary(input: LeadContext) {
    return this.run(input, "Draft a high-level multi-day itinerary outline.");
  }

  draftQuoteFollowUp(input: LeadContext) {
    return this.run(input, "Draft a polite quote follow-up email.");
  }

  async draftReengagement(input: CustomerContext): Promise<CopilotResult> {
    const prompt = [
      systemPreamble(),
      "Task: Draft a previous-customer re-engagement message.",
      `Name: ${input.firstName} ${input.lastName}`,
      `Returning: ${input.isReturning ? "yes" : "no"}`,
      `Destination hint: ${input.destinationHint ?? input.lastTripDestination ?? "n/a"}`,
    ].join("\n");
    const content = await generate(this.model, this.baseUrl, prompt);
    return wrapOllama(content);
  }
}

export async function isOllamaReachable(baseUrl: string, timeoutMs = 1500): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function ollamaHasModel(
  baseUrl: string,
  model: string,
  timeoutMs = 1500,
): Promise<boolean> {
  if (!model.trim()) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const data = (await response.json()) as {
      models?: { name?: string; model?: string }[];
    };
    const models = data.models ?? [];
    return models.some((entry) => {
      const name = entry.name ?? entry.model ?? "";
      return name === model || name.startsWith(`${model}:`) || name.split(":")[0] === model;
    });
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
