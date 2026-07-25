# Architecture

TravelFlow Growth OS is a **monolithic Next.js 15 application** with server-side data access through Prisma and SQLite. The UI is a single workspace shell with feature modules for dashboard, leads, campaigns, automations, reports, inquiry capture, and demo guidance.

> **Disclaimer:** This prototype is a hypothesis based on JSP Media's public services and a conversation about travel clients. It is not presented as an assumption about a specific client or role. A real engagement would begin with discovery, current-system review, requirements, success metrics, scope, and client approval.

---

## High-level component architecture

```mermaid
flowchart TB
  subgraph Client["Browser"]
    Pages["App Router Pages"]
    Features["Feature Components"]
    UI["Shared UI Components"]
  end

  subgraph Server["Next.js Server"]
    Actions["Server Actions"]
    Lib["Domain Libraries"]
  end

  subgraph Data["Persistence"]
    Prisma["Prisma Client"]
    SQLite["SQLite dev.db"]
  end

  subgraph Intelligence["Intelligence Layer"]
    Score["Lead Scoring"]
    Metrics["Analytics Metrics"]
    Reco["Recommendations"]
    Auto["Automation Engine"]
    AI["AI Providers"]
  end

  Pages --> Features --> UI
  Pages --> Actions
  Actions --> Lib
  Lib --> Prisma --> SQLite
  Lib --> Score
  Lib --> Metrics
  Lib --> Reco
  Lib --> Auto
  Lib --> AI
```

### Directory layout

| Path | Role |
|------|------|
| `src/app/` | Routes, layouts, Server Actions |
| `src/features/` | Page-specific UI (dashboard charts, leads pipeline, copilot panel) |
| `src/components/` | Reusable layout and UI primitives |
| `src/lib/` | Domain logic: analytics, automations, scoring, AI, validation |
| `prisma/` | Schema, migrations via `db push`, seed script |
| `tests/` | Vitest unit/integration, Playwright E2E |

There is **no separate API route layer** in this prototype. Mutations and reads for interactive flows go through **Server Actions** and server components that call Prisma directly.

---

## Application shell and routing

```mermaid
flowchart LR
  Root["/"] --> Dash["/dashboard"]
  Dash --> Inquiry["/inquiry"]
  Dash --> Leads["/leads"]
  Leads --> LeadDetail["/leads/[id]"]
  Dash --> Campaigns["/campaigns"]
  Dash --> AutoPage["/automations"]
  Dash --> Reports["/reports"]
  Dash --> Demo["/demo"]
```

`AppShell` provides left navigation, Horizon Trails branding, and **Demo Workspace / Demo AI Mode** badges. All authenticated-workspace pages share this shell via `src/app/layout.tsx`.

---

## Data flow: inquiry to dashboard

```mermaid
sequenceDiagram
  participant User as Traveler / Demo user
  participant Form as InquiryForm
  participant Action as createInquiry
  participant Score as calculateLeadScore
  participant Auto as runNewInquiryAutomations
  participant DB as SQLite via Prisma
  participant Dash as fetchDashboardData

  User->>Form: Submit inquiry
  Form->>Action: FormData (Server Action)
  Action->>Action: Zod validation (inquirySchema)
  Action->>DB: Upsert Customer
  Action->>Score: Score from dates, budget, source, etc.
  Action->>DB: Create Lead (stage NEW)
  Action->>DB: Create SYSTEM activity
  Action->>Auto: Acknowledgment, task, optional priority alert
  Auto->>DB: Activities, Tasks, AutomationRuns
  Action-->>User: Success + leadId
  Note over Dash: Dashboard revalidates on next load
  Dash->>DB: Query leads, campaigns, bookings
  Dash->>Dash: compute metrics + recommendations
```

### Inquiry workflow details

1. **Validation** — `src/lib/validation/inquiry.ts` validates name, email, dates, budget, trip type, interests, consent.
2. **Customer** — Match by email or create new; update phone/contact preference if returning email.
3. **Scoring** — `calculateLeadScore()` returns 0–100 score and factor list stored on the lead.
4. **Assignment** — Random consultant from `CONSULTANTS` constant.
5. **Lead creation** — Stage `NEW`; interests serialized as JSON string.
6. **Timeline** — `Inquiry submitted` system activity.
7. **Automations** — `runNewInquiryAutomations()` (idempotent):
   - Acknowledgment activity (no real email)
   - Follow-up task due within `FOLLOW_UP_HOURS` (default 24h)
   - Priority notification if score ≥ 75
8. **Cache** — `revalidatePath` for `/leads` and `/dashboard`.

Consultant actions on lead detail (`updateStage`, `addNote`, `createQuote`, `createBooking`, copilot) follow the same pattern: validate → Prisma write → activity log → revalidate.

---

## Lead pipeline and consultant workflow

```mermaid
stateDiagram-v2
  [*] --> NEW: Inquiry submitted
  NEW --> CONTACTED: Consultant responds
  CONTACTED --> QUALIFIED: Budget/fit confirmed
  QUALIFIED --> QUOTE_SENT: Quote sent
  QUOTE_SENT --> BOOKED: Customer accepts
  QUOTE_SENT --> LOST: Declined / stalled
  CONTACTED --> LOST
  QUALIFIED --> LOST
  NEW --> LOST
  BOOKED --> [*]
  LOST --> [*]
```

**First response tracking:** When stage moves off `NEW`, if `firstResponseAt` is null it is set to `now`. This feeds **Average First Response Time** on the dashboard.

**Views:** Leads page supports table and kanban-style pipeline (`LeadsPipeline`) with shared filters.

---

## Automation design

Automations are **operational guardrails**, not autonomous customer messaging.

### Rule catalog

| Rule | Trigger (conceptual) | Action |
|------|---------------------|--------|
| New inquiry acknowledgment | `lead.created` | ACKNOWLEDGMENT activity |
| New inquiry follow-up task | `lead.created` | Task due within SLA |
| High-priority notification | `lead.created && score >= 75` | PRIORITY_NOTIFICATION activity |
| Uncontacted overdue | `NEW` + no firstResponse past threshold | OVERDUE_REMINDER (idempotent) |
| Quote unanswered | `QUOTE_SENT` past threshold | Follow-up task + activity |
| Booking review request | `tripCompletedAt` set | REVIEW_REQUEST draft activity |
| Previous customer re-engagement | Returning + stale activity | REENGAGEMENT suggestion |

### Execution model

```mermaid
flowchart TD
  A["Event: new inquiry"] --> B["runNewInquiryAutomations"]
  C["Manual: Run evaluator"] --> D["evaluateOverdueAutomations"]
  B --> E{"Rule enabled?"}
  D --> E
  E -->|yes| F{"Idempotent check"}
  F -->|not exists| G["Create activity/task"]
  F -->|exists| H["SKIPPED AutomationRun"]
  G --> I["SUCCESS AutomationRun"]
  G --> J["Increment rule.runCount"]
```

- **Immediate rules** run inside `createInquiry` via `runNewInquiryAutomations`.
- **Time-based rules** run when an admin clicks **Run evaluator** on `/automations` (`evaluateOverdueAutomations`).
- **Idempotency** — Duplicate checks on activity type, task title, etc., prevent double acknowledgments or duplicate overdue reminders.
- **Audit** — Every run creates an `AutomationRun` with `SUCCESS`, `SKIPPED`, or `FAILED`.
- **Configuration** — Rules can be toggled enabled/disabled in the UI; SLA hours via environment variables.

**Limitation:** There is no cron/queue. Overdue detection does not run until the evaluator is invoked.

---

## Analytics design

### Data sources

| Input | Used for |
|-------|----------|
| Leads (filtered by date, source, destination) | Funnel, qualified counts, response time |
| Bookings (filtered by `bookedAt`) | Revenue, confirmed bookings, ROAS numerator |
| Campaigns (all) | Spend aggregation by channel |
| Lead relations (quotes, bookings, customer.isReturning) | Source/campaign metrics, new vs returning |

### Pipeline

```mermaid
flowchart LR
  DB["Prisma queries"] --> M["metrics.ts functions"]
  M --> F["buildFunnelCounts"]
  M --> S["computeSourceMetrics"]
  M --> C["computeCampaignMetrics"]
  M --> R["buildRecommendations"]
  F --> UI["DashboardCharts / CampaignViews"]
  S --> UI
  C --> UI
  R --> UI
```

**Recommendations** (`recommendations.ts`) are rule-based narrative cards driven by thresholds—for example slow average response (>12h), weak ROAS campaigns (spend ≥ $2,000 and ROAS < 1.2x), quote-stage drop-off, top destination revenue, returning vs new booking rates.

**Default date window:** Last 90 days ending today unless query params override.

See [METRICS.md](./METRICS.md) for exact formulas.

---

## AI provider design

```mermaid
flowchart TD
  Start["generateCopilotDraft"] --> Select["selectCopilotProvider"]
  Select --> Mode{"AI_MODE"}
  Mode -->|demo| Demo["DemoTravelCopilotProvider"]
  Mode -->|auto / ollama| Check["Ollama reachable + model?"]
  Check -->|yes| Ollama["OllamaTravelCopilotProvider"]
  Check -->|no| Demo
  Demo --> Draft["Template draft from LeadContext"]
  Ollama --> LLM["Local HTTP generate"]
  Draft --> Save["CopilotDraft + EMAIL_DRAFT activity"]
  LLM --> Save
  LLM -->|error| Demo
```

| Mode | Behavior |
|------|----------|
| `auto` (default) | Try Ollama; fall back to demo |
| `demo` | Always use template provider |
| `ollama` | Prefer Ollama; fall back to demo if unavailable |

**Draft types:** `INQUIRY_SUMMARY`, `NEXT_ACTION`, `INITIAL_RESPONSE`, `ITINERARY`, `QUOTE_FOLLOW_UP`, `REENGAGEMENT`

**Safety labeling:** All demo drafts append a review footer. UI shows provider mode. No automatic send path exists.

**Limitation:** Ollama output quality depends on local model; no RAG over live supplier inventory or pricing.

---

## Failure handling

| Scenario | Behavior |
|----------|----------|
| Invalid form input | Zod errors returned to client; no DB write |
| Lead not found | Action returns `{ ok: false, message }` |
| Automation already applied | `SKIPPED` run logged; no duplicate side effects |
| Ollama unreachable | Silent fallback to Demo AI Mode |
| Ollama request throws | `runCopilot` catches and retries with demo provider |
| Division by zero in metrics | `safeDivide` returns `null`; UI shows "—" |
| Missing seed lead (E2E) | Playwright test skips Maya copilot check |

There is no global error boundary productization or retry queue for failed automations in this prototype.

---

## Security considerations (prototype scope)

**Current state:**

- No authentication or session management
- No CSRF tokens beyond Next.js Server Action defaults
- SQLite file on disk with no encryption at rest
- `.env` gitignored; `DATABASE_URL` required locally
- No rate limiting on inquiry form
- AI drafts may echo PII from lead records into SQLite

**Before production:**

- Add authN/authZ, tenant isolation, and audit trails
- Move secrets to a managed store; never commit `.env`
- Sanitize and minimize PII sent to LLM providers
- HTTPS-only deployment, CSP headers, input sanitization for stored HTML
- Consent and retention policies for marketing data
- Separate staging/production databases

---

## Production evolution

```mermaid
flowchart TB
  subgraph Now["Prototype"]
    Next["Next.js monolith"]
    SQL["SQLite"]
    Manual["Manual automation evaluator"]
    DemoAI["Demo / local Ollama"]
  end

  subgraph Target["Production-oriented"]
    Next2["Next.js + API/workers"]
    PG["PostgreSQL"]
    Queue["Job queue / cron"]
    Integrations["CRM · Email · Ads"]
    ManagedAI["Governed AI service"]
  end

  Now --> Target
```

Reasonable evolution path for a JSP Media client engagement:

1. Replace SQLite with PostgreSQL and formal migrations
2. Extract automation evaluator to scheduled workers
3. Integrate CRM as system of record (sync leads both ways)
4. Connect email provider with send-only after human approval
5. Import campaign spend from ad APIs or CSV pipelines
6. Add auth, roles (consultant vs manager vs admin)
7. Introduce observability and on-call alerts for integration failures

---

## Key design principles embodied in code

1. **Human in the loop** — Automations log and task; AI drafts; nothing auto-sends to customers
2. **Transparent scoring** — Factor strings stored on each lead, not black-box ML
3. **Honest demo data** — Seeded patterns (e.g., Instagram lower conversion, referral strength) support realistic dashboard stories
4. **Minimal scope** — Server Actions over microservices; SQLite over managed infra for local demo velocity

---

## Related documents

- [METRICS.md](./METRICS.md) — KPI definitions
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) — Live walkthrough
- [INTERVIEW_QA.md](./INTERVIEW_QA.md) — Scope and tradeoff Q&A
- [BUILD_REPORT.md](./BUILD_REPORT.md) — Implementation checklist
