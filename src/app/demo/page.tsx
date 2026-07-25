import { PageHeader } from "@/components/ui/PageHeader";
import { DemoGuideContent } from "@/features/demo/DemoGuideContent";

export const metadata = { title: "Demo Guide" };

export default function DemoPage() {
  return (
    <div>
      <PageHeader
        title="Demo Guide"
        description="Walk through TravelFlow Growth OS with a structured narrative for Horizon Trails Travel and JSP Media conversations."
      />
      <DemoGuideContent />
    </div>
  );
}
