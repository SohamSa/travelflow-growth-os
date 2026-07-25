# Demo Script (15–30 minutes)

Presentation script for **TravelFlow Growth OS** — a prototype growth workspace for boutique travel agencies. Adjust pacing: ~15 minutes if you skip Reports deep-dive; ~25–30 minutes with Q&A and a live inquiry submission.

**Presenter setup before call:**

```bash
cd travelflow-growth-os
npm run db:reset   # optional: fresh seed
npm run dev        # http://localhost:3000
```

Confirm sidebar shows **Demo Workspace** and **Demo AI Mode**.

---

> **Opening disclaimer (read verbatim)**
>
> This prototype is a hypothesis based on JSP Media's public services and a conversation about travel clients. It is not presented as an assumption about a specific client or role. A real engagement would begin with discovery, current-system review, requirements, success metrics, scope, and client approval.

---

## 1. Opening and business context (2–3 min)

**Say:**

> "Today I'm showing TravelFlow Growth OS—a prototype I built to explore how a boutique travel agency could unify inquiries, marketing attribution, and consultant follow-up in one workspace. The fictional client is **Horizon Trails Travel**, a mid-size agency selling curated trips. All data is seeded demo data, not a real JSP client."

**Set the scene:**

Horizon Trails receives leads from Instagram ads, Google, referrals, and their website. Consultants juggle email and spreadsheets. Leadership asks: *Which channels actually produce bookings?* and *Why do quotes stall?*

---

## 2. Three problems (2 min)

**Problem 1 — Fragmented inquiry handling**

> "Inquiries arrive from many channels with no unified scoring or SLA tracking. Consultants triage manually instead of prioritizing high-intent trips."

**Problem 2 — Marketing spend without booking attribution**

> "Campaign tools show clicks, but the agency can't easily see cost per booking or ROAS by channel—or which destinations drive revenue."

**Problem 3 — Manual follow-up at scale**

> "Quote follow-ups and overdue reminders depend on memory. Leads sit in Quote Sent while high-intent anniversaries and honeymoons need faster, consistent outreach—still with a human in the loop."

**Transition:**

> "TravelFlow addresses these with a single workspace: pipeline, dashboard, automations, and an AI copilot that drafts content for employee review—nothing auto-sends."

---

## 3. Live demo sequence

### 3.1 Dashboard — executive view (3–4 min)

**Navigate:** `/dashboard`

**Show:**

1. **KPI row** — Total leads, qualified, quotes sent, confirmed bookings, lead-to-booking %, quote-to-booking %, avg first response time, revenue, spend, ROAS.
2. **Funnel chart** — Stage distribution (New → Contacted → … → Booked / Lost).
3. **Spend vs revenue by source** — Call out Instagram vs Referral patterns in seed data.
4. **One recommendation card** — e.g. slow response, weak ROAS campaign, or quote drop-off.

**Say:**

> "Metrics come from transparent formulas in code—documented in METRICS.md—not a black box. When there's no denominator, we show a dash instead of misleading zeroes."

**Optional:** Apply filters (source = Instagram, destination = Italy) to narrow the story.

---

### 3.2 Maya Patel — consultant workflow (5–6 min)

**Navigate:** `/leads` → search **Maya Patel**

**Narrate her story:**

| Field | Value |
|-------|-------|
| Trip | Anniversary **Italy**, **2 travelers**, **7 days** |
| Interests | Culture, local food, moderate luxury |
| Budget | ~$8,500 (mid-range) |
| Source | **Instagram** |
| Stage | **Contacted** — not yet quoted |
| Consultant | Avery Chen |
| Timeline | Automated acknowledgment + follow-up task; first response ~2 hours |

**On lead detail (`/leads/[id]`):**

1. **Score & factors** — Rule-based 0–100 with visible factor strings (dates, budget, source, etc.).
2. **Activity timeline** — Acknowledgment (automated, no real email), follow-up task, first consultant response, stage change to Contacted.
3. **Open tasks** — Initial consultant follow-up.
4. **AI Travel Copilot** — Generate **Inquiry Summary** or **Next Action**.
   - Point to **Demo AI Mode** badge.
   - Read the footer: *Draft for employee review. Do not send without human approval.*

**Say:**

> "Maya is mid-funnel: contacted but no quote yet. The copilot helps Avery draft a personalized response about boutique stays and a cooking class—Avery edits before any customer sees it."

**Optional live actions:**

- Add a consultant note.
- Generate **Initial Response** draft.
- Move stage to **Qualified** (shows first-response tracking if not already set).

**Do not claim** emails were sent or quotes delivered outside the app.

---

### 3.3 New inquiry — intake + automations (3–4 min)

**Navigate:** `/inquiry`

**Submit a sample inquiry** (or describe if time is short):

- Destination: Greece, romantic, 2 travelers, budget ~$7,000, source Referral
- Check consent

**After submit:**

1. Show confirmation and link to new lead profile.
2. On lead detail: stage **New**, score calculated, **Inquiry submitted** activity.
3. Point out automated **acknowledgment** and **follow-up task** (from `runNewInquiryAutomations`).
4. If score ≥ 75, mention **priority notification** rule.

**Say:**

> "This replaces a scattered form-to-inbox flow with immediate scoring, assignment, and operational guardrails—still no autonomous customer email."

---

### 3.4 Automations (2–3 min)

**Navigate:** `/automations`

**Show:**

- List of seven rules (acknowledgment, follow-up task, priority, overdue new lead, quote follow-up, review request, re-engagement).
- Toggle one rule off/on.
- Click **Run evaluator** for time-based overdue logic.

**Say:**

> "Time-based rules don't run on a cron in this prototype—an admin runs the evaluator. Production would use scheduled jobs. Every run is audited with SUCCESS or SKIPPED for idempotency."

---

### 3.5 Campaigns (2 min)

**Navigate:** `/campaigns`

**Show one strong and one weak campaign:**

- CPL, CPB, lead-to-booking, ROAS
- Tie back to Problem 2: *bookings*, not just clicks

**Say:**

> "Spend is seeded or manually entered—no live Google/Meta API in the prototype. A real build would import spend or sync via integration."

---

### 3.6 Reports (1–2 min, optional)

**Navigate:** `/reports`

- Print preview
- CSV export for leadership

**Say:**

> "Managers get a snapshot without rebuilding spreadsheets from the CRM."

---

## 4. Key insights to land (2 min)

1. **Attribution to bookings** — Channels ranked by conversion and ROAS, not vanity metrics.
2. **Transparent prioritization** — Scoring factors are inspectable; high scores trigger notifications, not auto-bookings.
3. **Human-in-the-loop AI** — Copilot accelerates drafts; automations create tasks and timeline entries.
4. **Operational SLAs** — Response time and overdue rules surface process gaps visible in recommendations.
5. **Maya narrative** — Instagram can drive volume; anniversary Italy trips need fast, personalized follow-up before quote stage.

---

## 5. JSP Media service mapping (2 min)

**Hypothesis only—not a proposed SOW:**

| TravelFlow capability | JSP Media–adjacent real-world fit |
|----------------------|-----------------------------------|
| Inquiry capture | WordPress/forms, landing pages, UTM discipline |
| Lead pipeline | CRM stage management, consultant ownership |
| Campaign analytics | Paid search/social reporting, budget accountability |
| Automations | Operational playbooks, not spam blasts |
| Copilot | Consultant productivity, not customer-facing chatbots |
| Reports | Leadership reviews, client reporting cadence |

**Say:**

> "I'd start any real engagement with discovery: current CRM, booking tools, SLAs, and which metrics leadership already trusts."

---

## 6. Architecture in plain language (2 min)

**Say:**

> "It's a Next.js 15 app with TypeScript and Tailwind. Data lives in SQLite via Prisma for easy local demos. Server Actions handle forms—no separate API layer. Analytics and scoring are plain TypeScript functions with unit tests. AI is pluggable: Demo Mode by default, optional local Ollama, always with fallback. Charts use Recharts."

Refer to `docs/ARCHITECTURE.md` if asked for diagrams.

---

## 7. Business value (1–2 min)

- **Consultants** — Less triage, clearer next actions, draft acceleration.
- **Marketing** — See which channels and destinations earn bookings.
- **Leadership** — Funnel, ROAS, and recommendations in one place.
- **Clients (indirect)** — Faster, more consistent responses when staff adopt the workflow.

Quantified ROI would require client baselines—not claimed in this demo.

---

## 8. Limitations — be explicit (2 min)

- Fictional agency; synthetic seed data
- No authentication or multi-user permissions
- SQLite; not production-grade concurrency
- No real email, SMS, CRM, or ad platform integrations
- Automations are in-app only; evaluator is manual
- Rule-based scoring, not ML
- AI drafts require review; no live pricing or availability
- Campaign spend not synced from ad accounts

---

## 9. Closing (1–2 min)

**Say:**

> "TravelFlow Growth OS is a working hypothesis: one workspace where inquiries become scored leads, marketing connects to bookings, and AI assists staff without replacing them. I'd welcome your questions on scope, integrations, or how I'd phase this for a real agency client."

**Closing questions for the audience:**

1. Which metric would Horizon Trails leadership trust first—lead-to-booking or quote-to-booking?
2. How does your team handle Instagram inquiries today vs referral leads?
3. What CRM or booking tool would need to be system of record in a production version?
4. Where would you draw the line on automation vs consultant judgment for high-value trips like Maya's anniversary?
5. What would discovery look like in the first two weeks of a JSP Media engagement?

---

## Reset between demos

- UI: **Demo Guide → Reset demo data**
- CLI: `npm run db:reset`

---

## Timing cheat sheet

| Section | Minutes |
|---------|---------|
| Disclaimer + context + problems | 5–6 |
| Dashboard | 3–4 |
| Maya Patel lead | 5–6 |
| Inquiry + automations | 3–4 |
| Campaigns + reports | 2–3 |
| JSP mapping + architecture + value | 4–5 |
| Limitations + close | 3–4 |
| **Total** | **~22–30** (flexible) |

---

## Troubleshooting during live demo

| Issue | Recovery |
|-------|----------|
| Empty dashboard | Run `npm run db:seed` or `npm run db:reset` |
| Maya not found | Search "Patel" or re-seed; check console for Maya lead id |
| Copilot slow/errors | Demo Mode fallback should still return a draft |
| Port in use | `npx kill-port 3000` or change dev port |

---

## Related documents

- [README.md](../README.md) — Setup and commands
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical design
- [INTERVIEW_QA.md](./INTERVIEW_QA.md) — Extended Q&A
