import { PageHeader } from "@/components/ui/PageHeader";
import { InquiryForm } from "@/features/inquiries/InquiryForm";

export const metadata = { title: "Inquiry" };

export default function InquiryPage() {
  return (
    <div>
      <PageHeader
        title="Travel Inquiry"
        description="Capture a new lead from the Horizon Trails Travel inquiry form. Submissions trigger lead scoring and new-inquiry automations."
      />
      <InquiryForm />
    </div>
  );
}
