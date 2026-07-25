# TravelFlow Growth OS

**From marketing inquiry to booked journey** — a prototype that shows travel businesses how to capture leads faster, connect campaigns to revenue, and support consultants with safe AI drafts.

## Live demo (no setup required)

### 👉 [Open the live app](https://travelflow-growth-os.vercel.app)

Business owners and stakeholders can click that link and use the full product in the browser — **no terminal, no install, no technical steps**.

| Useful starting points | Link |
|------------------------|------|
| Executive dashboard | https://travelflow-growth-os.vercel.app/dashboard |
| Lead pipeline (search **Maya Patel**) | https://travelflow-growth-os.vercel.app/leads |
| Guided demo walkthrough | https://travelflow-growth-os.vercel.app/demo |
| Source code on GitHub | https://github.com/SohamSa/travelflow-growth-os |

> **For business owners & stakeholders:** open the live app first, then use [How we solve the three problems](#how-we-solve-the-three-problems) and the [15–30 minute demo script](docs/DEMO_SCRIPT.md). Technical depth lives in [Architecture](docs/ARCHITECTURE.md).

---

> **Important disclaimer**
>
> This prototype is a hypothesis based on JSP Media's public services and a conversation about travel clients. It is not presented as an assumption about a specific client or role. A real engagement would begin with discovery, current-system review, requirements, success metrics, scope, and client approval.
>
> Horizon Trails Travel and all seeded travelers (including Maya Patel) are **fictional**. No real customer data is included.

---

## How we solve the three problems

| Business problem | What owners feel today | What TravelFlow Growth OS demonstrates |
|------------------|------------------------|----------------------------------------|
| **1. Leads are lost or followed up too slowly** | Inquiries arrive from ads, Instagram, referrals, and the website — ownership is unclear and response time slips. | One inquiry form → scored lead → acknowledgment activity → consultant follow-up task → pipeline stages (New → Booked/Lost) with a full timeline. |
| **2. Marketing cannot be tied to bookings** | Teams see clicks and spend, not which channels produce quotes and revenue. | Dashboard + campaigns connect spend → inquiries → qualified leads → quotes → bookings → revenue (CPL, CPB, ROAS, funnel). |
| **3. Customer communication is generic** | Consultants rewrite the same summaries, replies, and itineraries by hand. | AI Travel Copilot drafts inquiry summaries, next actions, replies, itineraries, and follow-ups — always labeled **Draft for employee review** (never auto-sent). |

**Sample story used in demos:** Maya Patel — Instagram inquiry for a 7-day Italy anniversary trip (2 travelers, culture / local food / moderate luxury). Search for her on the [Leads](https://travelflow-growth-os.vercel.app/leads) page.

## Stakeholder path (click the link — nothing to install)

1. **[Live app](https://travelflow-growth-os.vercel.app)** — click around the product  
2. **This README** — problem framing and solution map  
3. **[docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)** — presentation script for a 15–30 minute walkthrough  
4. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — high-level system design (plain language + diagrams)  
5. **[docs/METRICS.md](docs/METRICS.md)** — how KPIs are calculated (so numbers stay trustworthy)  
6. **[docs/INTERVIEW_QA.md](docs/INTERVIEW_QA.md)** — honest answers on scope, what’s simulated, and what a real engagement would change  

> **Hosted demo note:** The live site is deployed for stakeholder demos. Some interactive changes may reset between visits because this is a shared prototype environment. Use **Demo Guide → Reset demo data** if you want to restore the original Maya Patel story.

## What this is

TravelFlow Growth OS is a **Next.js demo application** for the fictional agency **Horizon Trails Travel**. It combines a lead pipeline, executive dashboard, campaign analytics, automation rules, AI-assisted drafting, and printable reports—backed by a seeded SQLite database so the product is explorable without external CRM or ad-platform credentials.

Nothing in this repo sends real email, SMS, or payment requests. Automations create **in-app activities and tasks**; the copilot produces **labeled drafts** that require consultant approval before any customer-facing use.

## Feature overview

| Area | Capabilities |
|------|----------------|
| **Dashboard** | KPI cards, funnel chart, source metrics, response-time trend, lost-reason breakdown, new vs returning comparison, spend vs revenue, data-driven recommendations |
| **Inquiry** | Public-style web form with Zod validation, rule-based lead scoring, automatic consultant assignment, new-inquiry automations |
| **Leads** | Table and pipeline views, filters, lead detail with timeline, tasks, stage updates, notes, quotes, bookings |
| **Campaigns** | Per-campaign CPL, CPB, lead-to-booking, quote-to-booking, ROAS |
| **Automations** | Seven configurable rules (acknowledgment, follow-up tasks, priority alerts, overdue reminders, quote follow-up, review requests, re-engagement); manual evaluator |
| **Reports** | Leadership summary with print preview and CSV export |
| **AI Copilot** | Inquiry summary, next action, initial response, itinerary, quote follow-up, re-engagement drafts |
| **Demo Guide** | In-app walkthrough, JSP mapping hypothesis, reset button |

## Architecture summary

```
Browser (Next.js 15 App Router, React 19, Tailwind v4)
    ↓ Server Actions
Prisma ORM → SQLite (local dev.db)
    ↓
Modules: scoring · automations · analytics · AI providers (Demo / optional Ollama)
```

- **Frontend:** App Router pages under `src/app/`, feature components under `src/features/`, shared UI under `src/components/`
- **Server layer:** Server Actions in `src/app/actions/` (no REST API layer in this prototype)
- **Data:** Prisma schema in `prisma/schema.prisma`; seed script generates ~420 customers, ~520 leads, campaigns, quotes, and bookings
- **Intelligence:** Transparent rule-based lead scoring (`src/lib/scoring/lead-score.ts`), analytics metrics (`src/lib/analytics/metrics.ts`), recommendation engine
- **AI:** Pluggable providers with Demo AI Mode fallback (`src/lib/ai/`)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for diagrams and deeper design notes.

## Data model summary

| Model | Purpose |
|-------|---------|
| `Customer` | Traveler identity, contact preferences, returning flag |
| `Lead` | Inquiry with destination, dates, budget, stage, score, assignment |
| `Campaign` | Marketing channel, spend, impressions, clicks, sessions |
| `Quote` | Draft / sent / accepted quotes linked to leads |
| `Booking` | Confirmed booking with revenue and reference |
| `Activity` | Timeline events (notes, stage changes, automations, drafts) |
| `Task` | Consultant to-dos with priority and due dates |
| `AutomationRule` / `AutomationRun` | Rule definitions and execution audit trail |
| `CopilotDraft` | Saved AI draft content with provider label |

**Lead stages:** `NEW` → `CONTACTED` → `QUALIFIED` → `QUOTE_SENT` → `BOOKED` or `LOST`

## Tech stack

- **Runtime:** Node.js 20+
- **Framework:** Next.js 15 (App Router, Turbopack dev)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Prisma 6 + SQLite
- **Charts:** Recharts
- **Validation:** Zod
- **Dates:** date-fns
- **Icons:** Lucide React
- **Unit tests:** Vitest + Testing Library
- **E2E tests:** Playwright
- **Optional AI:** Local [Ollama](https://ollama.com/) (not required)

## Setup

### Prerequisites

- Node.js **20 or later**
- npm (ships with Node)

### 1. Install dependencies

```bash
cd travelflow-growth-os
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
```

Optional variables:

```env
# AI provider selection: auto | demo | ollama (default: auto)
AI_MODE=auto

# Ollama (only used when AI_MODE=auto or ollama and Ollama is reachable)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Automation SLA thresholds (hours)
FOLLOW_UP_HOURS=24
OVERDUE_NEW_LEAD_HOURS=48
OVERDUE_QUOTE_HOURS=72
```

### 3. Initialize and seed the database

```bash
npm run db:push
npm run db:seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home route redirects to `/dashboard`.

### Reset demo data

From the UI: **Demo Guide → Reset demo data**, or from the terminal:

```bash
npm run db:reset
```

This runs `prisma db push --force-reset` and re-seeds the database.

## npm scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run test` | Vitest unit/integration tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright E2E tests (starts dev server) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push schema to SQLite |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Force-reset DB and re-seed |
| `npm run verify` | typecheck + lint + test + build |

## Optional Ollama setup

Ollama is **optional**. The app works fully in **Demo AI Mode** without it.

1. Install Ollama from [https://ollama.com](https://ollama.com)
2. Pull a model, e.g. `ollama pull llama3.2`
3. Set `OLLAMA_MODEL=llama3.2` in `.env`
4. Leave `AI_MODE=auto` (default) or set `AI_MODE=ollama`

With `AI_MODE=auto`, the app probes Ollama at startup. If the server is unreachable or the model is missing, it **falls back to Demo AI Mode** automatically. Copilot errors also fall back to demo templates.

To force deterministic demo output (recommended for interviews): `AI_MODE=demo`

## Demo AI Mode (default fallback)

When Ollama is unavailable or `AI_MODE=demo`, the **DemoTravelCopilotProvider** generates structured drafts from lead context—summaries, next actions, email templates, itineraries, and follow-ups. Every draft includes an explicit footer:

> Draft for employee review. Do not send without human approval.

The sidebar shows a **Demo AI Mode** badge. No paid cloud AI API is used in this prototype.

## Sample demo lead: Maya Patel

Search leads for **Maya Patel** (`maya.patel.0@example.com`):

- Anniversary trip to **Italy**, **2 travelers**, **7 days**
- Interests: culture, local food, moderate luxury
- Budget ~**$8,500** (mid-range)
- Source: **Instagram**
- Stage: **Contacted** (acknowledgment logged, follow-up task assigned, first response ~2h—**no quote yet**)
- Assigned consultant: **Avery Chen**

Use this lead for copilot and pipeline demos. See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

## Testing

```bash
# Unit + integration
npm run test

# End-to-end (requires Playwright browsers)
npx playwright install chromium
npm run test:e2e

# Full verification pipeline
npm run verify
```

**Verification status:** Typecheck, lint, unit/integration tests (16), Playwright e2e (4), and production build all passed in the local verification run. Details: [docs/BUILD_REPORT.md](docs/BUILD_REPORT.md).

**Note:** Playwright E2E tests may fail if Chromium is not installed (`npx playwright install`). E2E starts its own dev server via `playwright.config.ts`.

## Metrics reference

All dashboard KPIs and campaign metrics are computed in `src/lib/analytics/metrics.ts`. Formulas and edge cases (including safe division returning `null`) are documented in [docs/METRICS.md](docs/METRICS.md).

## Limitations (honest)

- **Prototype only** — Fictional agency, synthetic seed data, no production auth or multi-tenant isolation
- **SQLite** — Single-file local DB; not suitable for concurrent production workloads
- **No real integrations** — No live CRM, email, SMS, payment, or ad-platform APIs
- **Simulated automations** — Rules create in-app records; they do not send external notifications
- **Rule-based scoring** — Transparent heuristics, not machine learning
- **Campaign spend** — Entered/seeded manually, not synced from Google/Meta
- **No role-based access** — Any local user can view and mutate demo data
- **AI drafts** — Templates or local LLM output; require human review; no booking or pricing guarantees

## Production-hardening recommendations

For a real client engagement, a production path would typically include:

1. **Discovery & scope** — Current CRM, booking tools, marketing stack, SLAs, and success metrics
2. **Managed database** — PostgreSQL (or client-approved DB) with migrations, backups, and connection pooling
3. **Authentication & authorization** — SSO, consultant roles, audit logging
4. **Real integrations** — CRM sync (e.g. HubSpot, TravelJoy), email (SendGrid/Postmark), optional SMS, ad spend import
5. **Background jobs** — Queue-based automation evaluation instead of manual "Run evaluator"
6. **Observability** — Structured logging, error tracking, automation run alerts
7. **AI governance** — Approved models, PII handling, prompt/version control, send-blocking until human approval
8. **Compliance** — GDPR/CCPA consent storage, data retention, export/delete workflows
9. **Deployment** — Vercel/AWS with secrets management, staging environment, CI verification gates

## Documentation index

| Document | Contents |
|----------|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Component architecture, data flow, diagrams |
| [docs/METRICS.md](docs/METRICS.md) | KPI formulas matching `metrics.ts` |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | 15–30 minute presentation script |
| [docs/INTERVIEW_QA.md](docs/INTERVIEW_QA.md) | Interview Q&A with honest scope boundaries |
| [docs/BUILD_REPORT.md](docs/BUILD_REPORT.md) | Implementation summary and verification placeholders |

## License

Prototype shared for portfolio, interview, and stakeholder demonstration. All agency and traveler data is fictional.
