import { useMemo } from "react";
import { Check, CalendarClock, MapPin, Pill } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { usePrescriptionStore } from "@/store/prescriptionStore";
import { mockDoctors } from "@/lib/mock/mockDoctors";
import type { PrescriptionStatus } from "@/types";

const TIMELINE_STEPS = [
  "Appointment Booked",
  "Tests Completed",
  "Sent to Doctor",
  "Doctor Approved",
  "Ready to Collect",
] as const;

function getTimelineIndex(status?: PrescriptionStatus) {
  switch (status) {
    case "pending_review":
    case "in_transit":
      return 2;
    case "approved":
    case "modified":
      return 3;
    case "fulfilled":
      return 4;
    default:
      return 1;
  }
}

function getPatientMessage(index: number, doctorName?: string, clinicName?: string) {
  if (index >= 4 && clinicName) {
    return `Your prescription is ready. Return to ${clinicName} to collect it.`;
  }

  if (index >= 3 && doctorName) {
    return `Dr. ${doctorName.replace(/^Dr\.\s*/i, "")} approved your note. Check back soon for collection instructions.`;
  }

  if (index >= 2 && doctorName && clinicName) {
    return `Please visit Dr. ${doctorName.replace(/^Dr\.\s*/i, "")} at ${clinicName} to continue your treatment.`;
  }

  return "Your appointment is booked. The pharmacist will prepare the note once your review is complete.";
}

export function PatientPage() {
  const { prescriptions } = usePrescriptionStore();
  const latestPrescription = prescriptions.length
    ? prescriptions[prescriptions.length - 1]
    : undefined;
  const timelineIndex = getTimelineIndex(latestPrescription?.status);

  const doctor = useMemo(
    () =>
      mockDoctors.find(
        (item) =>
          item.id === latestPrescription?.doctorId ||
          item.midenAccountId === latestPrescription?.doctorId,
      ),
    [latestPrescription?.doctorId],
  );

  const hasSummary = timelineIndex >= 3 && Boolean(latestPrescription);
  const statusLabel =
    latestPrescription?.status === "fulfilled"
      ? "Ready to Collect"
      : latestPrescription?.status === "approved" || latestPrescription?.status === "modified"
        ? "Doctor Approved"
        : latestPrescription?.status === "pending_review" || latestPrescription?.status === "in_transit"
          ? "Sent to Doctor"
          : "Appointment Booked";

  return (
    <div className="min-h-screen bg-orange-50/40 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Patient Portal</h1>
            <p className="text-sm text-text-secondary mt-1">
              Follow your prescription progress and collection status.
            </p>
          </div>

          <Card className="bg-white">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Status Timeline</h2>
              <Badge type={timelineIndex === 4 ? "normal" : "amber"}>{statusLabel}</Badge>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              {TIMELINE_STEPS.map((step, index) => {
                const isComplete = index < timelineIndex;
                const isActive = index === timelineIndex;
                return (
                <div key={step} className="flex md:flex-1 md:items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isComplete || isActive
                        ? "bg-primary-800 text-white"
                        : "bg-surface-sunken text-text-tertiary"
                    }`}
                  >
                    {isComplete ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <p
                    className={`text-sm ${
                      isActive ? "text-primary-800 font-semibold" : "text-text-secondary"
                    }`}
                  >
                    {step}
                  </p>
                  {index < TIMELINE_STEPS.length - 1 && (
                    <div className="hidden md:block flex-1 h-px bg-border-default mx-2" />
                  )}
                </div>
              );
              })}
            </div>
          </Card>

          <Card className={timelineIndex === 4 ? "border-status-normal/30 bg-green-50" : "border-primary-200 bg-primary-50"}>
            <p className={`text-sm ${timelineIndex === 4 ? "text-green-900" : "text-primary-900"}`}>
              {getPatientMessage(timelineIndex, doctor?.name, doctor?.clinicName)}
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Upcoming Appointment</h2>
              <div className="space-y-3 text-sm">
              <p className="text-text-secondary">
                <span className="font-medium text-text-primary">Pharmacist:</span> Sarah Chen
              </p>
              <p className="text-text-secondary">
                <span className="font-medium text-text-primary">Clinic:</span> Green Valley Pharmacy
              </p>
              <div className="flex items-center gap-2 text-text-secondary">
                <CalendarClock className="w-4 h-4" />
                <span>
                  {latestPrescription?.createdAt
                    ? new Date(latestPrescription.createdAt).toLocaleString()
                    : "Appointment time pending"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <MapPin className="w-4 h-4" />
                <span>123 Health Ave, Suite 12 (placeholder)</span>
              </div>
              <Badge type="normal">Confirmed</Badge>
              </div>
            </Card>

            {hasSummary && latestPrescription ? (
              <Card className="bg-white">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Prescription Summary</h2>
                <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-text-primary">
                  <Pill className="w-4 h-4" />
                  <span className="font-medium">{latestPrescription.medication}</span>
                </div>
                <p className="text-text-secondary">
                  <span className="font-medium text-text-primary">Dosage:</span>{" "}
                  {latestPrescription.dosage}
                </p>
                <p className="text-text-secondary">
                  <span className="font-medium text-text-primary">Frequency:</span>{" "}
                  {latestPrescription.frequency}
                </p>
                <p className="text-text-secondary">
                  <span className="font-medium text-text-primary">Duration:</span>{" "}
                  {latestPrescription.duration}
                </p>
                </div>
              </Card>
            ) : (
              <Card className="bg-white">
                <p className="text-sm text-text-secondary">
                  Prescription details will appear once the doctor approves your note.
                </p>
              </Card>
            )}
          </div>
        </div>
    </div>
  );
}
