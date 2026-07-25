"use client";

import { useState, useTransition } from "react";
import { Bot, Copy, Check, Sparkles } from "lucide-react";
import { generateCopilotDraft } from "@/app/actions/copilot";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";

const DRAFT_TYPES = [
  { value: "INQUIRY_SUMMARY", label: "Inquiry summary" },
  { value: "NEXT_ACTION", label: "Next action" },
  { value: "INITIAL_RESPONSE", label: "Initial response" },
  { value: "ITINERARY", label: "Itinerary outline" },
  { value: "QUOTE_FOLLOW_UP", label: "Quote follow-up" },
  { value: "REENGAGEMENT", label: "Re-engagement" },
] as const;

interface CopilotPanelProps {
  leadId: string;
  existingDrafts: { id: string; type: string; content: string; createdAt: Date }[];
}

export function CopilotPanel({ leadId, existingDrafts }: CopilotPanelProps) {
  const [draftType, setDraftType] = useState<string>("INQUIRY_SUMMARY");
  const [content, setContent] = useState("");
  const [modeLabel, setModeLabel] = useState<"Ollama" | "Demo AI Mode">("Demo AI Mode");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    const formData = new FormData();
    formData.set("leadId", leadId);
    formData.set("draftType", draftType);

    startTransition(async () => {
      const result = await generateCopilotDraft(formData);
      setMessage(result.message);
      if (result.ok && result.content) {
        setContent(result.content);
        if (result.modeLabel) setModeLabel(result.modeLabel);
      }
    });
  }

  async function handleCopy() {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal" />
            <CardTitle>AI Copilot</CardTitle>
          </div>
          <Badge variant="demo">
            <Bot className="mr-1 h-3 w-3" />
            {modeLabel}
          </Badge>
        </div>
        <p className="text-sm text-slate">
          Generate consultant drafts for employee review. Nothing is sent automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {DRAFT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setDraftType(type.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                draftType === type.value
                  ? "border-teal bg-teal/10 text-teal"
                  : "border-border bg-white text-slate hover:border-teal/30"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <Button onClick={handleGenerate} disabled={pending} variant="coral">
          {pending ? "Generating…" : "Generate draft"}
        </Button>

        {message && <p className="text-sm text-teal">{message}</p>}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-navy">Draft for employee review</label>
            {content && (
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Generated draft will appear here. You can edit before sending manually."
            className="min-h-[220px] font-mono text-xs"
          />
        </div>

        {existingDrafts.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-navy">Recent drafts</p>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {existingDrafts.slice(0, 5).map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() => setContent(draft.content)}
                  className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs hover:border-teal/30"
                >
                  <span className="font-medium text-navy">
                    {draft.type.replaceAll("_", " ").toLowerCase()}
                  </span>
                  <p className="mt-1 line-clamp-2 text-slate">{draft.content.slice(0, 120)}…</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
