import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { mockPrescriptionInbox } from "@/lib/mock/mockPrescriptionInbox";
import { useDoctorStore } from "@/store/doctorStore";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Clock, CheckCircle, AlertCircle, Inbox } from "lucide-react";

export function DoctorPage() {
  const navigate = useNavigate();
  const { prescriptionInbox, initializeInbox, getStats } = useDoctorStore();

  // Initialize inbox on mount
  useEffect(() => {
    if (prescriptionInbox.length === 0) {
      initializeInbox(mockPrescriptionInbox);
    }
  }, []);

  const stats = useMemo(() => getStats(), [getStats, prescriptionInbox]);

  const getExpiryColor = (expiresAt: Date) => {
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilExpiry < 24) return "text-red-600 bg-red-50";
    if (hoursUntilExpiry < 48) return "text-amber-600 bg-amber-50";
    return "text-green-600 bg-green-50";
  };

  const getExpiryText = (expiresAt: Date) => {
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilExpiry < 1) return "Expires in <1 hour";
    if (hoursUntilExpiry < 24) return `Expires in ${Math.round(hoursUntilExpiry)}h`;
    const daysUntilExpiry = Math.round(hoursUntilExpiry / 24);
    return `Expires in ${daysUntilExpiry}d`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_review":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-base">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Doctor Portal</h1>
          <p className="text-text-secondary mt-1">Review and approve prescriptions from pharmacists</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-semibold">📥</span>
              </div>
              <div>
                <p className="text-xs font-medium text-text-tertiary">Received today</p>
                <p className="text-2xl font-bold text-blue-600">{stats.receivedToday}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <span className="text-lg font-semibold">⏳</span>
              </div>
              <div>
                <p className="text-xs font-medium text-text-tertiary">Pending review</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingReview}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-lg font-semibold">✅</span>
              </div>
              <div>
                <p className="text-xs font-medium text-text-tertiary">Approved (7d)</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedThisWeek}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Prescription Inbox */}
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">Prescription Inbox</h2>
          <Card>
            {prescriptionInbox.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
                <p className="text-text-secondary">No prescriptions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptionInbox.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="flex items-start justify-between gap-4 p-4 border border-border-default rounded-lg hover:bg-surface-raised transition-colors cursor-pointer"
                    onClick={() => navigate(`/doctor/prescription/${prescription.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-text-primary">
                          Patient {prescription.patientIdAnonymized}
                        </p>
                        <Badge type={prescription.status === "pending_review" ? "amber" : prescription.status === "approved" ? "normal" : "high"}>
                          {prescription.status.replace("_", " ")}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-text-secondary mb-2">
                        {prescription.pharmacistName}
                        {prescription.pharmacistVerified && (
                          <span className="ml-1 text-green-600">✓ Verified</span>
                        )}
                      </p>
                      
                      <p className="text-sm font-medium text-text-primary mb-2">
                        {prescription.medication} {prescription.dosage}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-text-secondary">
                          {prescription.frequency} for {prescription.duration}
                        </p>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getExpiryColor(prescription.expiresAt)}`}>
                          <Clock className="w-3 h-3" />
                          {getExpiryText(prescription.expiresAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-text-tertiary">
                      {getStatusIcon(prescription.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
