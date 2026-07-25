# Interview Q&A

Honest, interview-ready answers for TravelFlow Growth OS. Use these as talking points—not scripts to memorize verbatim.

> **Disclaimer:** This prototype is a hypothesis based on JSP Media's public services and a conversation about travel clients. It is not presented as an assumption about a specific client or role. A real engagement would begin with discovery, current-system review, requirements, success metrics, scope, and client approval.

---

## Why did you build this?

I built TravelFlow Growth OS to demonstrate how I would approach a **boutique travel marketing and operations** problem end-to-end: not just a landing page, but inquiry intake, pipeline management, attribution metrics, automations, and AI-assisted drafts—with clear boundaries on what's real vs simulated.

The goal was a **runnable prototype** a stakeholder could click through in a interview, backed by documented architecture, tested metrics, and an honest limitations list. It shows product thinking, full-stack execution, and communication about scope.

---

## What is your relationship to JSP Media?

This project is a **hypothesis** inspired by JSP Media's publicly described services (travel-industry marketing, web, and growth work) and a general conversation about travel-agency client needs. It is **not** based on insider knowledge of a specific JSP client, proprietary data, or an assigned role.

I do not present this as work JSP Media commissioned or approved. A real engagement would start with discovery, access to current systems, agreed success metrics, and client sign-off on scope.

---

## What three business problems does it address?

1. **Fragmented inquiry handling** — Leads from web, ads, referrals, and email lack unified scoring, assignment, and SLA visibility. Consultants waste time triaging.

2. **Marketing spend without booking attribution** — Leadership sees campaign activity but struggles to connect spend to **bookings**, ROAS, and destination-level revenue.

3. **Manual follow-up at scale** — Quote follow-ups, overdue new leads, and re-engagement depend on individual memory; high-intent opportunities stall in Quote Sent.

---

## What is actually implemented vs simulated?

| Implemented (real in app) | Simulated / not connected |
|---------------------------|---------------------------|
| SQLite database with Prisma ORM | Production PostgreSQL / hosted DB |
| Inquiry form → lead creation | External website embed / WordPress plugin |
| Rule-based lead scoring with visible factors | ML predictive models |
| Dashboard KPIs from real queries over seed/live data | Live Google/Meta Ads API |
| Seven automation rules with audit runs | Cron/queue scheduling |
| In-app activities and tasks | Email, SMS, push notifications |
| AI copilot drafts (Demo Mode + optional Ollama) | Paid cloud LLM APIs |
| Campaign spend from seed/manual entry | Automatic spend sync |
| Reports print/CSV export | Client-branded PDF automation |
| Server Actions for mutations | Public REST/GraphQL API |
| Vitest + Playwright test suites | CI pipeline in this repo (verify locally) |

**Nothing auto-sends to customers.** Acknowledgments are timeline entries labeled as automated with explicit "no real email was sent" copy.

---

## What would change for a real client?

1. **Discovery** — Map current CRM, booking engine, email tools, ad accounts, team roles, SLAs.
2. **Integrations** — CRM as system of record; bi-directional sync; email send only after human approval.
3. **Infrastructure** — Managed database, auth, staging/prod environments, secrets management.
4. **Data model** — Client-specific fields (consortium affiliations, supplier IDs, commission rules).
5. **Automations** — Scheduled workers, escalation paths, business-hours rules.
6. **Metrics** — Align definitions with how the client already reports; add multi-touch if needed.
7. **Compliance** — Consent, retention, GDPR/CCPA, PCI boundaries if payments involved.
8. **AI policy** — Approved models, PII redaction, prompt governance, no guaranteed pricing.

Scope and timeline would be **proposal-driven**, not implied by this demo.

---

## How would CRM integration work?

**Conceptual approach:**

1. Choose system of record (HubSpot, TravelJoy, Salesforce, etc.) in discovery.
2. Map TravelFlow entities: Customer ↔ Contact, Lead ↔ Deal/Inquiry, Booking ↔ Won opportunity or custom object.
3. Use webhooks or scheduled sync (ETL/iPaaS) for creates/updates both ways.
4. Keep **consultant-facing UX** in TravelFlow or embed as a custom CRM view—client preference.
5. Conflict rules: e.g. CRM wins on contact info; TravelFlow wins on scoring factors until CRM catches up.

This prototype uses **local SQLite only**—no OAuth, no sync jobs. I'd estimate integration as its own workstream with test accounts and field mapping workshops.

---

## Email and SMS?

**Not implemented.** Automations create in-app activities and tasks. Copilot drafts email **text** for employee review.

Production path:

- **Email:** SendGrid, Postmark, or CRM-native email with templates, unsubscribe compliance, and send gates requiring explicit consultant action.
- **SMS:** Twilio or CRM SMS with opt-in proof and quiet hours—only if client policy allows.

I'd avoid autonomous SMS for high-consideration travel purchases without strong consent and human oversight.

---

## Privacy and data handling?

**Prototype gaps:**

- No login; anyone with local access sees all data
- SQLite file unencrypted on disk
- AI providers receive lead context (name, email, trip details) when generating drafts
- `.env` for local config; not committed

**Production expectations:**

- Role-based access, audit logs, encryption at rest and in transit
- Data processing agreements for any LLM vendor
- Minimize PII in prompts; retention and deletion workflows
- Consent captured at inquiry (form includes consent checkbox in prototype)

---

## How would this scale?

**Current limits:** SQLite, single Next.js instance, manual automation evaluator, no caching layer.

**Scale path:**

- PostgreSQL with connection pooling (PgBouncer)
- Background job queue (BullMQ, SQS, etc.) for automations and sync
- Read replicas or materialized views for heavy analytics
- Horizontal Next.js instances behind load balancer
- Separate analytics warehouse if historical reporting grows large

For a boutique agency (dozens of consultants, thousands of leads/month), a well-architected monolith plus managed DB is often sufficient before microservices.

---

## What happens when an integration fails?

**In this prototype:** N/A—no external integrations.

**Production design I'd recommend:**

- Idempotent webhooks with retry and dead-letter queue
- `AutomationRun` status `FAILED` with error summary (pattern already in schema)
- Alerting (PagerDuty, Slack) on repeated sync failures
- Graceful degradation: consultants can still work leads in-app while sync recovers
- Reconciliation job to detect drift between CRM and TravelFlow

The automation engine already logs **SKIPPED** vs **SUCCESS** for idempotency—a pattern I'd extend to integration jobs.

---

## What if AI is unavailable?

Built-in **fallback chain:**

1. `AI_MODE=auto`: probe Ollama; if unreachable or model missing → Demo AI Mode
2. Ollama throws at runtime → `runCopilot` catches and re-runs with `DemoTravelCopilotProvider`
3. `AI_MODE=demo`: always use deterministic templates

Consultants still have full pipeline functionality without AI. Draft buttons show **Demo AI Mode** so users know they're not on a live LLM.

For production, I'd add circuit breakers, latency timeouts, and optional queue-based generation.

---

## How do you prevent duplicate follow-ups?

**Automation idempotency:**

- Before creating acknowledgment, check for existing `ACKNOWLEDGMENT` activity with `isAutomated: true`
- Before follow-up task, check for open task with title `Initial consultant follow-up`
- Overdue and quote rules use similar existence checks
- Skipped runs logged to `AutomationRun` for audit

**Not covered in prototype:** Cross-channel dedup (same person submits web form twice), CRM-side duplicate contacts—that would need email/phone matching rules in discovery.

---

## Pricing and scope — how would you propose this?

I would **not** price from this demo alone. A proposal would follow discovery:

| Phase | Typical focus |
|-------|----------------|
| Discovery | Workshops, system audit, metrics alignment |
| MVP | CRM sync, auth, core pipeline, one integration |
| Growth | Campaign import, automations, copilot, reporting |
| Hardening | Compliance, monitoring, training |

Ballpark drivers: number of integrations, CRM complexity, custom reporting, AI governance requirements, and whether TravelFlow replaces or augments existing tools.

This repo is a **portfolio prototype**, not a fixed product SKU.

---

## Personal ownership vs specialists?

**I built this prototype end-to-end** as a demonstration: product framing, UX, Next.js app, Prisma schema, analytics, automations, AI provider abstraction, tests, and documentation.

**On a client team, I'd collaborate with:**

- **Design** — Brand, accessibility, design system beyond demo Tailwind
- **DevOps** — CI/CD, hosting, secrets, observability
- **Integration specialist** — CRM/ad platform connectors
- **Account/strategy** — JSP Media client discovery and success metrics

I'm comfortable owning technical architecture and implementation while pulling specialists where depth matters. I'd be transparent with clients about team composition.

---

## Technical depth questions

### Why Next.js Server Actions instead of a REST API?

For this scope, Server Actions reduce boilerplate and keep mutations colocated with the App Router. A production client might still expose APIs for mobile apps or CRM webhooks—I'd add route handlers or a separate service when integrations require it.

### Why SQLite?

Fast local setup for demos and interviews—zero external dependencies. Documented as a limitation; PostgreSQL for production.

### Why rule-based scoring instead of ML?

Interpretability for consultants and stakeholders. Factors display on each lead. ML could come later **if** the client has enough labeled outcome data and a governance model.

### How do you test metrics correctness?

`tests/unit/metrics.test.ts` covers counts, conversions, and `safeDivide` edge cases. Dashboard integration relies on those pure functions. See BUILD_REPORT for verification status.

### What's the Maya Patel demo lead for?

A consistent narrative: anniversary Italy, Instagram source, Contacted stage, acknowledgment + task, no quote—ideal for copilot and pipeline demos without spoiling booking metrics.

---

## Questions to ask the interviewer

1. How does JSP Media typically phase discovery vs build for travel clients?
2. Which CRMs do you see most often in boutique travel?
3. Where do clients draw the line on marketing automation vs high-touch consulting?
4. What does success look like in the first 90 days of a growth OS engagement?

---

## Red lines — what not to claim

- Do **not** say this is an active JSP client project unless it becomes one.
- Do **not** say emails/SMS/ads are live-connected.
- Do **not** say tests/build passed without verification (see BUILD_REPORT).
- Do **not** claim paid AI services were used—Demo Mode and optional local Ollama only.
- Do **not** promise booking conversion lifts without client baselines.

---

## Related documents

- [README.md](../README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- [BUILD_REPORT.md](./BUILD_REPORT.md)
