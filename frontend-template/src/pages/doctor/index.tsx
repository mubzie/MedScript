import { EmptyState } from "@/components/shared/Badge";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/shared/Button";

export function DoctorPage() {
  return (
    <div className="min-h-screen bg-surface-base p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Doctor Portal</h1>
        <EmptyState
          icon={<Stethoscope className="w-12 h-12" />}
          title="Welcome to Your Medical Practice"
          subtitle="This page is ready for Phase 6 implementation"
          action={<Button>Get Started</Button>}
        />
      </div>
    </div>
  );
}
