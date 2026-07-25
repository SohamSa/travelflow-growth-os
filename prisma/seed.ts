import {
  ContactMethod,
  LeadStage,
  MarketingSource,
  PrismaClient,
  QuoteStatus,
  TripType,
} from "@prisma/client";
import { addDays, addHours, subDays, subHours } from "date-fns";
import { calculateLeadScore, serializeScoreExplanation } from "../src/lib/scoring/lead-score";
import { DEFAULT_AUTOMATION_RULES } from "../src/lib/automation/engine";

const prisma = new PrismaClient();

const SEED = 42;
const DESTINATIONS = [
  "Italy",
  "France",
  "Greece",
  "Japan",
  "Thailand",
  "Mexico",
  "Costa Rica",
  "Hawaii",
  "Colorado",
  "New York",
] as const;

const CONSULTANTS = ["Avery Chen", "Jordan Blake", "Sam Rivera", "Casey Morgan"] as const;

const FIRST_NAMES = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "Lucas",
  "Mia", "Logan", "Amelia", "James", "Harper", "Benjamin", "Evelyn", "Henry", "Abigail", "Alexander",
  "Emily", "Michael", "Elizabeth", "Daniel", "Sofia", "Jacob", "Chloe", "Jackson", "Ella", "Sebastian",
  "Grace", "Aiden", "Victoria", "Matthew", "Riley", "Samuel", "Aria", "David", "Scarlett", "Joseph",
  "Maya", "Priya", "Hiro", "Elena", "Carlos", "Nina", "Owen", "Zoe", "Leo", "Hannah",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Patel", "Kim", "Nguyen", "Chen", "Wright", "Scott", "Torres", "Nguyen", "Adams", "Baker",
];

const INTERESTS = [
  "culture",
  "local food",
  "moderate luxury",
  "museums",
  "hiking",
  "beaches",
  "nightlife",
  "wildlife",
  "photography",
  "spa",
  "history",
  "wine",
  "family activities",
  "adventure sports",
];

const LOST_REASONS = [
  "No response after follow-up",
  "Budget mismatch",
  "Chose another agency",
  "Travel dates changed",
  "Delayed follow-up",
  "Missing information",
];

class Rng {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)]!;
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  shuffle<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  }
}

function sourceWeight(rng: Rng): MarketingSource {
  const roll = rng.next();
  if (roll < 0.22) return "INSTAGRAM";
  if (roll < 0.38) return "GOOGLE_ADS";
  if (roll < 0.5) return "FACEBOOK";
  if (roll < 0.62) return "ORGANIC_SEARCH";
  if (roll < 0.74) return "REFERRAL";
  if (roll < 0.86) return "EMAIL";
  return "DIRECT";
}

function tripTypeFor(destination: string, rng: Rng): TripType {
  if (destination === "Italy" || destination === "Japan" || destination === "France") {
    return rng.pick(["ROMANTIC", "CULTURAL", "LUXURY", "FAMILY"]);
  }
  if (destination === "Hawaii" || destination === "Thailand" || destination === "Mexico") {
    return rng.pick(["BEACH", "ROMANTIC", "FAMILY", "ADVENTURE"]);
  }
  return rng.pick([
    "ROMANTIC",
    "FAMILY",
    "ADVENTURE",
    "LUXURY",
    "CULTURAL",
    "BEACH",
    "GROUP",
  ]);
}

function bookingProbability(source: MarketingSource, fastResponse: boolean, isReturning: boolean, stageTarget: LeadStage): number {
  let base =
    source === "REFERRAL"
      ? 0.42
      : source === "GOOGLE_ADS"
        ? 0.28
        : source === "ORGANIC_SEARCH"
          ? 0.22
          : source === "DIRECT"
            ? 0.2
            : source === "EMAIL"
              ? 0.18
              : source === "FACEBOOK"
                ? 0.12
                : 0.1; // Instagram lower conversion

  if (fastResponse) base += 0.08;
  if (isReturning) base += 0.1;
  if (stageTarget === "BOOKED") return base;
  return base;
}

function avgBudget(destination: string, rng: Rng): number {
  const premium = destination === "Italy" || destination === "Japan" || destination === "Hawaii";
  const base = premium ? rng.int(6500, 14000) : rng.int(3200, 9000);
  return base;
}

async function main() {
  const rng = new Rng(SEED);
  const now = new Date("2026-07-24T15:00:00.000Z");

  console.log("Resetting database...");
  await prisma.copilotDraft.deleteMany();
  await prisma.automationRun.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.task.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.customer.deleteMany();

  for (const rule of DEFAULT_AUTOMATION_RULES) {
    await prisma.automationRule.create({
      data: {
        name: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        enabled: true,
        runCount: rng.int(5, 80),
        lastRunAt: subHours(now, rng.int(1, 72)),
      },
    });
  }

  const campaignDefs = [
    { name: "Italy Romance Spring", channel: "INSTAGRAM" as MarketingSource, destinationFocus: "Italy", spend: 9200, weak: false },
    { name: "Japan Culture Search", channel: "GOOGLE_ADS" as MarketingSource, destinationFocus: "Japan", spend: 7800, weak: false },
    { name: "Greece Islands Social", channel: "FACEBOOK" as MarketingSource, destinationFocus: "Greece", spend: 6400, weak: true },
    { name: "Thailand Adventure Retargeting", channel: "GOOGLE_ADS" as MarketingSource, destinationFocus: "Thailand", spend: 5100, weak: false },
    { name: "Hawaii Escape Email Nurture", channel: "EMAIL" as MarketingSource, destinationFocus: "Hawaii", spend: 1800, weak: false },
    { name: "Mexico Family Getaways", channel: "FACEBOOK" as MarketingSource, destinationFocus: "Mexico", spend: 4300, weak: false },
    { name: "Costa Rica Eco Adventures", channel: "INSTAGRAM" as MarketingSource, destinationFocus: "Costa Rica", spend: 3900, weak: true },
    { name: "France Culinary Moments", channel: "GOOGLE_ADS" as MarketingSource, destinationFocus: "France", spend: 6700, weak: false },
    { name: "Colorado Mountain Weekends", channel: "ORGANIC_SEARCH" as MarketingSource, destinationFocus: "Colorado", spend: 0, weak: false },
    { name: "New York City Breaks", channel: "DIRECT" as MarketingSource, destinationFocus: "New York", spend: 0, weak: false },
    { name: "Referral Partner Program", channel: "REFERRAL" as MarketingSource, destinationFocus: null, spend: 0, weak: false },
    { name: "Always-On Brand Search", channel: "GOOGLE_ADS" as MarketingSource, destinationFocus: null, spend: 11000, weak: false },
    { name: "Reels Awareness Burst", channel: "INSTAGRAM" as MarketingSource, destinationFocus: null, spend: 12500, weak: true },
    { name: "Newsletter Reactivation", channel: "EMAIL" as MarketingSource, destinationFocus: null, spend: 900, weak: false },
    { name: "Facebook Lookalike Broad", channel: "FACEBOOK" as MarketingSource, destinationFocus: null, spend: 8600, weak: true },
    { name: "SEO Destination Guides", channel: "ORGANIC_SEARCH" as MarketingSource, destinationFocus: null, spend: 0, weak: false },
    { name: "Direct Site Homepage", channel: "DIRECT" as MarketingSource, destinationFocus: null, spend: 0, weak: false },
    { name: "Italy Fall Wine Trails", channel: "INSTAGRAM" as MarketingSource, destinationFocus: "Italy", spend: 5400, weak: false },
    { name: "Japan Cherry Blossom Intent", channel: "GOOGLE_ADS" as MarketingSource, destinationFocus: "Japan", spend: 7200, weak: false },
    { name: "Greece Honeymoon Package", channel: "REFERRAL" as MarketingSource, destinationFocus: "Greece", spend: 0, weak: false },
  ];

  const campaigns = [];
  for (const def of campaignDefs) {
    const startDate = subDays(now, rng.int(120, 200));
    const endDate = addDays(now, rng.int(10, 60));
    const impressions = def.spend > 0 ? rng.int(80000, 420000) : rng.int(5000, 40000);
    const clicks = Math.floor(impressions * (def.weak ? 0.008 : 0.015));
    const websiteSessions = Math.floor(clicks * (def.weak ? 0.55 : 0.75));
    const campaign = await prisma.campaign.create({
      data: {
        name: def.name,
        channel: def.channel,
        destinationFocus: def.destinationFocus,
        startDate,
        endDate,
        spend: def.spend,
        impressions,
        clicks,
        websiteSessions,
      },
    });
    campaigns.push({ ...campaign, weak: def.weak });
  }

  const customerCount = 420;
  const customers = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < customerCount; i += 1) {
    let firstName = rng.pick(FIRST_NAMES);
    let lastName = rng.pick(LAST_NAMES);
    if (i === 0) {
      firstName = "Maya";
      lastName = "Patel";
    }
    let email = `${firstName}.${lastName}.${i}@example.com`.toLowerCase();
    while (usedEmails.has(email)) {
      email = `${firstName}.${lastName}.${i}.${rng.int(1, 9999)}@example.com`.toLowerCase();
    }
    usedEmails.add(email);
    const isReturning = i === 0 ? false : rng.chance(0.22);
    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email,
        phone: `+1-555-${String(rng.int(100, 999))}-${String(rng.int(1000, 9999))}`,
        preferredContactMethod: rng.pick([
          ContactMethod.EMAIL,
          ContactMethod.PHONE,
          ContactMethod.EITHER,
        ]),
        isReturning,
        createdAt: subDays(now, rng.int(30, 240)),
      },
    });
    customers.push(customer);
  }

  const maya = customers[0]!;
  const leadCount = 520;
  let bookingSeq = 1000;

  for (let i = 0; i < leadCount; i += 1) {
    const isMaya = i === 0;
    const customer = isMaya ? maya : rng.pick(customers);
    const source = isMaya ? ("INSTAGRAM" as MarketingSource) : sourceWeight(rng);
    const destination = isMaya ? "Italy" : rng.pick(DESTINATIONS);
    const matchingCampaigns = campaigns.filter(
      (c) =>
        c.channel === source &&
        (c.destinationFocus === destination || c.destinationFocus == null),
    );
    const campaign =
      source === "REFERRAL"
        ? campaigns.find((c) => c.channel === "REFERRAL")
        : rng.chance(0.75)
          ? rng.pick(matchingCampaigns.length ? matchingCampaigns : campaigns.filter((c) => c.channel === source))
          : undefined;

    const createdAt = isMaya ? subDays(now, 3) : subDays(now, rng.int(1, 150));
    const travelStart = isMaya
      ? addDays(now, 45)
      : addDays(createdAt, rng.int(30, 160));
    const travelEnd = addDays(travelStart, isMaya ? 6 : rng.int(4, 12));
    const travelerCount = isMaya ? 2 : rng.int(1, 6);
    const estimatedBudget = isMaya ? 8500 : avgBudget(destination, rng);
    const tripType = isMaya ? ("ROMANTIC" as TripType) : tripTypeFor(destination, rng);
    const interests = isMaya
      ? ["culture", "local food", "moderate luxury"]
      : rng.shuffle([...INTERESTS]).slice(0, rng.int(2, 4));
    const specialRequests = isMaya
      ? "Anniversary trip — looking for charming boutique stays, a cooking class, and a scenic countryside day without feeling rushed."
      : rng.chance(0.45)
        ? rng.pick([
            "Prefer quieter boutique hotels.",
            "Need connecting rooms for family.",
            "Interested in guided food experiences.",
            "Celebrate a birthday during the trip.",
            "Moderate walking pace preferred.",
          ])
        : null;

    const scoreResult = calculateLeadScore({
      travelStartDate: travelStart,
      travelEndDate: travelEnd,
      estimatedBudget,
      destination,
      phone: customer.phone,
      preferredContactMethod: customer.preferredContactMethod,
      travelerCount,
      specialRequests,
      source,
      isReturning: customer.isReturning,
      now: createdAt,
    });

    // Stage distribution with intentional patterns
    let stage: LeadStage = "NEW";
    const fastResponse = isMaya ? true : rng.chance(source === "REFERRAL" || source === "GOOGLE_ADS" ? 0.7 : 0.45);
    const bookRoll = rng.next();
    const bookP = bookingProbability(source, fastResponse, customer.isReturning, "BOOKED");

    if (isMaya) {
      stage = "CONTACTED";
    } else if (bookRoll < bookP) {
      stage = "BOOKED";
    } else if (bookRoll < bookP + 0.14) {
      stage = "QUOTE_SENT";
    } else if (bookRoll < bookP + 0.26) {
      stage = "QUALIFIED";
    } else if (bookRoll < bookP + 0.42) {
      stage = "CONTACTED";
    } else if (bookRoll < bookP + 0.55) {
      stage = "LOST";
    } else {
      stage = "NEW";
    }

    // Delayed follow-up more common among lost + Instagram
    const delayed = stage === "LOST" && rng.chance(0.4);
    const firstResponseAt =
      stage === "NEW"
        ? null
        : isMaya
          ? addHours(createdAt, 2)
          : delayed
            ? addHours(createdAt, rng.int(36, 96))
            : fastResponse
              ? addHours(createdAt, rng.int(1, 10))
              : addHours(createdAt, rng.int(12, 40));

    const assignedConsultant = isMaya ? "Avery Chen" : rng.pick(CONSULTANTS);
    const lostReason =
      stage === "LOST"
        ? delayed
          ? "Delayed follow-up"
          : rng.pick(LOST_REASONS)
        : null;

    const lead = await prisma.lead.create({
      data: {
        customerId: customer.id,
        campaignId: campaign?.id,
        source,
        destination,
        travelStartDate: travelStart,
        travelEndDate: travelEnd,
        travelerCount,
        estimatedBudget,
        tripType,
        interests: JSON.stringify(interests),
        specialRequests,
        stage,
        score: scoreResult.score,
        scoreExplanation: serializeScoreExplanation(scoreResult.factors),
        assignedConsultant,
        firstResponseAt,
        lostReason,
        createdAt,
        updatedAt: createdAt,
      },
    });

    // Acknowledgment + task for most leads
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: "ACKNOWLEDGMENT",
        title: "Inquiry acknowledged",
        description: `Automated acknowledgment logged for ${customer.firstName}. No real email was sent.`,
        channel: "System",
        isAutomated: true,
        occurredAt: addHours(createdAt, 0.1),
      },
    });

    await prisma.task.create({
      data: {
        leadId: lead.id,
        title: "Initial consultant follow-up",
        dueAt: addHours(createdAt, 24),
        completedAt:
          stage === "NEW" ? null : addHours(createdAt, rng.int(2, 30)),
        priority: scoreResult.score >= 75 ? "HIGH" : "MEDIUM",
        assignedTo: assignedConsultant,
        createdAt: addHours(createdAt, 0.15),
      },
    });

    if (scoreResult.score >= 75) {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: "PRIORITY_NOTIFICATION",
          title: "High-priority lead notification",
          description: `Lead scored ${scoreResult.score}/100.`,
          channel: "System",
          isAutomated: true,
          occurredAt: addHours(createdAt, 0.2),
        },
      });
    }

    if (firstResponseAt) {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: "FOLLOW_UP",
          title: "First consultant response",
          description: `${assignedConsultant} made first contact with the traveler.`,
          channel: customer.preferredContactMethod === "PHONE" ? "Phone" : "Email",
          isAutomated: false,
          occurredAt: firstResponseAt,
        },
      });
    }

    const stagesReached: LeadStage[] = ["NEW"];
    if (["CONTACTED", "QUALIFIED", "QUOTE_SENT", "BOOKED", "LOST"].includes(stage)) {
      stagesReached.push("CONTACTED");
    }
    if (["QUALIFIED", "QUOTE_SENT", "BOOKED"].includes(stage)) {
      stagesReached.push("QUALIFIED");
    }
    if (["QUOTE_SENT", "BOOKED"].includes(stage)) {
      stagesReached.push("QUOTE_SENT");
    }
    if (stage === "BOOKED") stagesReached.push("BOOKED");
    if (stage === "LOST") stagesReached.push("LOST");

    for (let s = 1; s < stagesReached.length; s += 1) {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: "STAGE_CHANGE",
          title: `Stage changed to ${stagesReached[s]!.replaceAll("_", " ")}`,
          description: `Lead moved to ${stagesReached[s]!.replaceAll("_", " ")}.`,
          isAutomated: false,
          occurredAt: addHours(createdAt, s * 8 + rng.int(1, 5)),
        },
      });
    }

    if (stage === "QUOTE_SENT" || stage === "BOOKED") {
      const sentAt = addHours(createdAt, rng.int(24, 80));
      const amount =
        estimatedBudget *
        (destination === "Italy" || destination === "Japan" ? rng.next() * 0.15 + 0.95 : rng.next() * 0.2 + 0.85);
      await prisma.quote.create({
        data: {
          leadId: lead.id,
          amount: Math.round(amount),
          status: stage === "BOOKED" ? QuoteStatus.ACCEPTED : QuoteStatus.SENT,
          sentAt,
          expiresAt: addDays(sentAt, 14),
          createdAt: sentAt,
        },
      });
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: "QUOTE",
          title: "Quote sent",
          description: `Quote of $${Math.round(amount).toLocaleString("en-US")} sent for review.`,
          channel: "Email",
          isAutomated: false,
          occurredAt: sentAt,
        },
      });

      if (stage === "QUOTE_SENT" && rng.chance(0.35)) {
        // intentional drop-off without follow-up task completion
        await prisma.task.create({
          data: {
            leadId: lead.id,
            title: "Quote follow-up",
            dueAt: addHours(sentAt, 72),
            completedAt: null,
            priority: "HIGH",
            assignedTo: assignedConsultant,
            createdAt: addHours(sentAt, 1),
          },
        });
      }
    }

    if (stage === "BOOKED") {
      const quoteSentOffset = rng.int(30, 90);
      const bookedAt = addHours(createdAt, quoteSentOffset);
      const revenue =
        estimatedBudget *
        (destination === "Italy" || destination === "Japan" ? 1.05 + rng.next() * 0.25 : 0.9 + rng.next() * 0.2);
      bookingSeq += 1;
      const tripCompletedAt = rng.chance(0.35) ? addDays(travelEnd, rng.int(1, 10)) : null;
      await prisma.booking.create({
        data: {
          leadId: lead.id,
          bookingReference: `HT-${bookingSeq}`,
          revenue: Math.round(revenue),
          bookedAt,
          tripCompletedAt: tripCompletedAt && tripCompletedAt < now ? tripCompletedAt : null,
          createdAt: bookedAt,
        },
      });
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: "BOOKING",
          title: "Booking confirmed",
          description: `Booking HT-${bookingSeq} recorded for $${Math.round(revenue).toLocaleString("en-US")}.`,
          channel: "System",
          isAutomated: false,
          occurredAt: bookedAt,
        },
      });
    }

    if (rng.chance(0.3)) {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: "NOTE",
          title: "Consultant note",
          description: rng.pick([
            "Traveler prefers morning activities.",
            "Budget is flexible for unique experiences.",
            "Needs kid-friendly pacing.",
            "Interested in private transfers.",
          ]),
          isAutomated: false,
          occurredAt: addHours(createdAt, rng.int(5, 60)),
        },
      });
    }
  }

  // Sample automation runs
  const rules = await prisma.automationRule.findMany();
  const sampleLeads = await prisma.lead.findMany({ take: 40, orderBy: { createdAt: "desc" } });
  for (const lead of sampleLeads) {
    const rule = rng.pick(rules);
    await prisma.automationRun.create({
      data: {
        ruleId: rule.id,
        leadId: lead.id,
        status: "SUCCESS",
        summary: `Demo run: ${rule.name}`,
        executedAt: subHours(now, rng.int(1, 200)),
      },
    });
  }

  const totals = {
    customers: await prisma.customer.count(),
    leads: await prisma.lead.count(),
    campaigns: await prisma.campaign.count(),
    bookings: await prisma.booking.count(),
    quotes: await prisma.quote.count(),
    maya: await prisma.lead.findFirst({
      where: { customer: { email: "maya.patel.0@example.com" } },
      include: { customer: true },
    }),
  };

  console.log("Seed complete:", totals);
  console.log("Maya Patel lead id:", totals.maya?.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
