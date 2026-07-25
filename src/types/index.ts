import type {
  Activity,
  Booking,
  Campaign,
  ContactMethod,
  CopilotDraft,
  Lead,
  LeadStage,
  MarketingSource,
  Quote,
  Task,
  TripType,
} from "@prisma/client";

export type {
  Activity,
  Booking,
  Campaign,
  ContactMethod,
  CopilotDraft,
  Lead,
  LeadStage,
  MarketingSource,
  Quote,
  Task,
  TripType,
};

export const DESTINATIONS = [
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

export const CONSULTANTS = [
  "Avery Chen",
  "Jordan Blake",
  "Sam Rivera",
  "Casey Morgan",
] as const;

export const LOST_REASONS = [
  "No response after follow-up",
  "Budget mismatch",
  "Chose another agency",
  "Travel dates changed",
  "Delayed follow-up",
  "Missing information",
] as const;

export type Destination = (typeof DESTINATIONS)[number];
export type Consultant = (typeof CONSULTANTS)[number];

export type PriorityLabel = "High" | "Medium" | "Standard";

export interface LeadScoreResult {
  score: number;
  priority: PriorityLabel;
  factors: string[];
}

export interface DateRangeFilter {
  start: Date;
  end: Date;
}

export interface DashboardFilters {
  start: Date;
  end: Date;
  source?: MarketingSource | "ALL";
  destination?: string | "ALL";
}

export interface MetricValue {
  value: number | null;
  label: string;
  format: "number" | "currency" | "percent" | "hours";
}

export interface FunnelCounts {
  new: number;
  contacted: number;
  qualified: number;
  quoteSent: number;
  booked: number;
  lost: number;
  totalLeads: number;
  qualifiedLeads: number;
  quotesSent: number;
  confirmedBookings: number;
}

export interface SourceMetrics {
  source: MarketingSource;
  leads: number;
  qualified: number;
  bookings: number;
  revenue: number;
  spend: number;
  costPerLead: number | null;
  costPerBooking: number | null;
  leadToBooking: number | null;
  roas: number | null;
}

export interface CampaignMetrics extends SourceMetrics {
  id: string;
  name: string;
  channel: MarketingSource;
  impressions: number;
  clicks: number;
  websiteSessions: number;
  quotes: number;
  leadConversion: number | null;
  bookingConversion: number | null;
}

export interface Recommendation {
  id: string;
  insight: string;
  supportingMetric: string;
  whyItMatters: string;
  recommendedAction: string;
  label: "Data-driven recommendation";
}

export interface LeadWithRelations extends Lead {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    preferredContactMethod: ContactMethod;
    isReturning: boolean;
  };
  campaign: Campaign | null;
  quotes: Quote[];
  bookings: Booking[];
  activities: Activity[];
  tasks: Task[];
  copilotDrafts: CopilotDraft[];
}

export const STAGE_LABELS: Record<LeadStage, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  QUOTE_SENT: "Quote Sent",
  BOOKED: "Booked",
  LOST: "Lost",
};

export const SOURCE_LABELS: Record<MarketingSource, string> = {
  GOOGLE_ADS: "Google Ads",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ORGANIC_SEARCH: "Organic Search",
  REFERRAL: "Referral",
  EMAIL: "Email",
  DIRECT: "Direct",
};

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  ROMANTIC: "Romantic",
  FAMILY: "Family",
  ADVENTURE: "Adventure",
  LUXURY: "Luxury",
  CULTURAL: "Cultural",
  BEACH: "Beach",
  GROUP: "Group",
};

export const PIPELINE_STAGES: LeadStage[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "QUOTE_SENT",
  "BOOKED",
  "LOST",
];
