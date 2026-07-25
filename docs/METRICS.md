# Metrics Reference

This document defines every analytics metric computed in `src/lib/analytics/metrics.ts` and consumed by the dashboard, campaigns page, and reports. UI formatting (currency, percent, hours) lives in `src/lib/utils.ts`.

**Source of truth:** `src/lib/analytics/metrics.ts`

---

## Safe division

All ratio metrics use `safeDivide(numerator, denominator)` from `src/lib/utils.ts`:

```typescript
export function safeDivide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}
```

When `safeDivide` returns `null`, formatters display **`—`** (em dash).

---

## Count metrics

### Total Leads

**Function:** `countTotalLeads(leads)`

**Formula:**

```
Total Leads = leads.length
```

**Input:** Array of leads (typically filtered by dashboard date range, source, destination).

**Notes:** Counts inquiry records created in the selected window, not unique customers.

---

### Qualified Leads

**Function:** `countQualifiedLeads(leads)`

**Formula:**

```
Qualified Leads = count of leads where stage ∈ { QUALIFIED, QUOTE_SENT, BOOKED }
```

**Implementation:**

```typescript
const QUALIFIED_STAGES = ["QUALIFIED", "QUOTE_SENT", "BOOKED"];
return leads.filter((lead) => QUALIFIED_STAGES.includes(lead.stage)).length;
```

**Notes:** `CONTACTED` and `NEW` are not qualified. `LOST` is excluded.

---

### Quotes Sent

**Function:** `countQuotesSent(leads)`

**Formula:**

```
Quotes Sent = count of leads where at least one quote satisfies:
  quote.status ∈ { SENT, ACCEPTED } OR quote.sentAt ≠ null
```

**Implementation:** Per-lead boolean—each lead counted at most once even with multiple quotes.

**Notes:** `DRAFT` quotes without `sentAt` do not count. Used for funnel and quote-to-booking conversion.

---

### Confirmed Bookings

**Function:** `countConfirmedBookings(bookings)`

**Formula:**

```
Confirmed Bookings = bookings.length
```

**Input:** Bookings filtered by `bookedAt` within the dashboard date range (and lead source/destination filters applied in `fetchDashboardData`).

**Notes:** Each booking record represents one confirmed reservation linked to a lead.

---

## Conversion metrics

### Lead-to-Booking Conversion

**Function:** `leadToBookingConversion(leads, bookings)`

**Formula:**

```
Lead-to-Booking Conversion (%) = (bookings / leads) × 100
```

**Parameters:**

- `leads` — total lead count (denominator)
- `bookings` — confirmed booking count (numerator)

**Returns:** `number | null` — `null` if `leads === 0` or non-finite inputs.

**Example:** 26 bookings from 520 leads → `26 / 520 × 100 = 5.0%`

**Used in:** Dashboard KPIs, source metrics, campaign metrics, new vs returning comparison.

---

### Quote-to-Booking Conversion

**Function:** `quoteToBookingConversion(quotesSent, bookings)`

**Formula:**

```
Quote-to-Booking Conversion (%) = (bookings / quotesSent) × 100
```

**Parameters:**

- `quotesSent` — count from `countQuotesSent`
- `bookings` — confirmed booking count in period

**Returns:** `number | null` — `null` if `quotesSent === 0`.

**Example:** 26 bookings from 80 quotes sent → `26 / 80 × 100 = 32.5%`

**Used in:** Dashboard KPIs, campaign `bookingConversion` field.

---

## Response time

### Average First Response Time

**Function:** `averageFirstResponseHours(leads)`

**Formula:**

For each lead where `firstResponseAt` is not null:

```
minutes_i = differenceInMinutes(firstResponseAt_i, createdAt_i)
```

Then:

```
Average First Response Time (hours) = (Σ minutes_i / count_responded) / 60
```

**Returns:** `number | null`

- `null` if no leads have `firstResponseAt` set
- Result is in **hours** (decimal), not minutes

**UI formatting** (`formatHours`):

- `< 1 hour` → shown as minutes (e.g. `45m`)
- `≥ 1 hour` → one decimal hour (e.g. `2.5h`)

**Notes:**

- Only leads with a recorded first response contribute
- `firstResponseAt` is set when stage moves off `NEW` or via seed data
- Dashboard trend chart buckets by lead `createdAt` date label

---

## Cost and return metrics

### Cost per Lead (CPL)

**Function:** `costPerLead(spend, leads)`

**Formula:**

```
Cost per Lead = spend / leads
```

**Returns:** `number | null` — `null` if `leads === 0`.

**Currency:** USD (raw number; UI formats with `formatCurrency`).

**Source spend:**

- **By channel:** Sum of `campaign.spend` where `campaign.channel === source`
- **By campaign:** Single campaign's `spend` field

---

### Cost per Booking (CPB)

**Function:** `costPerBooking(spend, bookings)`

**Formula:**

```
Cost per Booking = spend / bookings
```

**Returns:** `number | null` — `null` if `bookings === 0`.

---

### Return on Ad Spend (ROAS)

**Function:** `returnOnAdSpend(revenue, spend)`

**Formula:**

```
ROAS = revenue / spend
```

**Returns:** `number | null` — `null` if `spend === 0`.

**Display:** Dashboard shows as multiplier (e.g. `2.35x`), not percentage.

**Revenue source:** Sum of `booking.revenue` for attributed bookings in the filtered set.

**Interpretation:** `1.0x` = break-even on attributed revenue vs spend; `< 1.0x` = spend exceeds attributed booking revenue.

---

## Funnel aggregation

**Function:** `buildFunnelCounts(leads, bookings, quotesSentCount?)`

**Stage counts** (mutually exclusive by current stage):

| Field | Formula |
|-------|---------|
| `new` | `stage === NEW` |
| `contacted` | `stage === CONTACTED` |
| `qualified` | `stage === QUALIFIED` |
| `quoteSent` | `stage === QUOTE_SENT` |
| `booked` | `stage === BOOKED` |
| `lost` | `stage === LOST` |

**Rollups:**

| Field | Formula |
|-------|---------|
| `totalLeads` | `leads.length` |
| `qualifiedLeads` | `countQualifiedLeads(leads)` |
| `quotesSent` | `quotesSentCount ?? (quoteSent stage count + booked stage count)` |
| `confirmedBookings` | `bookings.length` |

**Note on `quotesSent` in funnel:** When the optional third argument is passed (dashboard passes `countQuotesSent(leads)`), funnel uses quote-record logic. Otherwise fallback counts leads currently in `QUOTE_SENT` or `BOOKED` stages.

---

## Source metrics

**Function:** `computeSourceMetrics(leads, campaigns)`

Produces one row per `MarketingSource` enum value:

`GOOGLE_ADS`, `INSTAGRAM`, `FACEBOOK`, `ORGANIC_SEARCH`, `REFERRAL`, `EMAIL`, `DIRECT`

| Field | Formula |
|-------|---------|
| `leads` | Leads where `lead.source === source` |
| `qualified` | `countQualifiedLeads(sourceLeads)` |
| `bookings` | All bookings on source leads (flatMap) |
| `revenue` | `Σ booking.revenue` for those bookings |
| `spend` | `Σ campaign.spend` where `campaign.channel === source` |
| `costPerLead` | `costPerLead(spend, leads)` |
| `costPerBooking` | `costPerBooking(spend, bookings)` |
| `leadToBooking` | `leadToBookingConversion(leads, bookings)` |
| `roas` | `returnOnAdSpend(revenue, spend)` |

**Attribution model (prototype):** Last-touch style—lead's `source` field and optional `campaignId`. No multi-touch or view-through modeling.

---

## Campaign metrics

**Function:** `computeCampaignMetrics(campaign, leads)`

| Field | Formula |
|-------|---------|
| `leads` | Leads where `lead.campaignId === campaign.id` |
| `qualified` | `countQualifiedLeads(attributed)` |
| `quotes` | `countQuotesSent(attributed)` |
| `bookings` | Bookings on attributed leads |
| `revenue` | Sum of booking revenue |
| `spend` | `campaign.spend` |
| `costPerLead` | `costPerLead(spend, leads)` |
| `costPerBooking` | `costPerBooking(spend, bookings)` |
| `leadToBooking` | `leadToBookingConversion(leads, bookings)` |
| `leadConversion` | `leadToBookingConversion(leads, qualified)` — **qualified** as denominator |
| `bookingConversion` | `quoteToBookingConversion(quotes, bookings)` |
| `roas` | `returnOnAdSpend(revenue, spend)` |

**Additional fields:** `impressions`, `clicks`, `websiteSessions` pass through from campaign record (not used in ROAS formula).

---

## Date filtering helpers

### `filterByDateRange(items, start, end)`

Keeps items where `start ≤ createdAt ≤ end`.

### `filterBookingsByDateRange(bookings, start, end)`

Keeps bookings where `start ≤ bookedAt ≤ end`.

Dashboard applies lead creation filter to lead-based metrics and booking date filter to revenue/booking counts.

---

## Dashboard KPI mapping

| UI label | Function(s) |
|----------|-------------|
| Total Leads | `countTotalLeads` |
| Qualified Leads | `countQualifiedLeads` |
| Quotes Sent | `countQuotesSent` |
| Confirmed Bookings | `countConfirmedBookings` |
| Lead-to-Booking | `leadToBookingConversion` → `formatPercent` |
| Quote-to-Booking | `quoteToBookingConversion` → `formatPercent` |
| Avg Response Time | `averageFirstResponseHours` → `formatHours` |
| Total Revenue | Sum of booking revenue (dashboard.ts) |
| Total Spend | Sum of all campaign spend |
| ROAS | `safeDivide(revenue, spend)` → `{value}x` |

---

## Edge cases summary

| Condition | Result |
|-----------|--------|
| Zero leads | CPL, lead-to-booking → `null` |
| Zero bookings | CPB, quote-to-booking (if quotes > 0) → `null` for CPB; quote-to-booking uses bookings numerator so 0% if quotes > 0 |
| Zero quotes sent | Quote-to-booking → `null` |
| Zero spend | ROAS → `null` |
| No first responses | Avg response time → `null` |
| Non-finite numbers | `safeDivide` → `null` |

---

## Verification

Unit tests in `tests/unit/metrics.test.ts` assert core counting and conversion behavior.

**Status:** See [BUILD_REPORT.md](./BUILD_REPORT.md) for latest test run results.
