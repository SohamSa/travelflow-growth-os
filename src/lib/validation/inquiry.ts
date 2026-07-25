import { z } from "zod";

export const inquirySchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name").max(120),
    email: z.string().trim().email("Please enter a valid email"),
    phone: z.string().trim().min(7, "Please enter a phone number").max(40),
    preferredDestination: z.string().trim().min(2, "Select a destination"),
    travelStartDate: z.string().min(1, "Start date is required"),
    travelEndDate: z.string().min(1, "End date is required"),
    travelerCount: z.coerce.number().int().min(1).max(40),
    estimatedBudget: z.coerce.number().min(500, "Budget helps us tailor options").max(500000),
    tripType: z.enum([
      "ROMANTIC",
      "FAMILY",
      "ADVENTURE",
      "LUXURY",
      "CULTURAL",
      "BEACH",
      "GROUP",
    ]),
    interests: z.array(z.string()).min(1, "Select at least one interest"),
    specialRequests: z.string().trim().max(2000).optional().default(""),
    preferredContactMethod: z.enum(["EMAIL", "PHONE", "EITHER"]),
    marketingSource: z.enum([
      "GOOGLE_ADS",
      "INSTAGRAM",
      "FACEBOOK",
      "ORGANIC_SEARCH",
      "REFERRAL",
      "EMAIL",
      "DIRECT",
    ]),
    consent: z.literal(true, {
      message: "Consent is required to submit this inquiry",
    }),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.travelStartDate);
    const end = new Date(data.travelEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "Travel dates must be valid",
        path: ["travelStartDate"],
      });
      return;
    }
    if (end < start) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be on or after the start date",
        path: ["travelEndDate"],
      });
    }
  });

export type InquiryInput = z.infer<typeof inquirySchema>;

export const stageUpdateSchema = z.object({
  leadId: z.string().min(1),
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "QUOTE_SENT", "BOOKED", "LOST"]),
  lostReason: z.string().optional(),
});

export const noteSchema = z.object({
  leadId: z.string().min(1),
  note: z.string().trim().min(1).max(4000),
});

export const taskSchema = z.object({
  leadId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  dueAt: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  assignedTo: z.string().trim().min(1).max(120),
});

export const quoteSchema = z.object({
  leadId: z.string().min(1),
  amount: z.coerce.number().min(100).max(1000000),
});

export const bookingSchema = z.object({
  leadId: z.string().min(1),
  revenue: z.coerce.number().min(100).max(1000000),
  bookingReference: z.string().trim().min(3).max(40).optional(),
});
