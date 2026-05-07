import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { mockPatients } from "@/lib/mock/mockPatients";
import { usePrescriptionStore } from "@/store/prescriptionStore";
import { usePatientQueueStore, type QueueStatus } from "@/store/patientQueueStore";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

interface QueueItem {
  id: string;
  name: string;
  time: string;
  status: QueueStatus;
}

const STATUS_BADGE_STYLES: Record<QueueStatus, string> = {
  Waiting: "bg-status-normal/20 text-status-normal border-status-normal/30",
  "In Session": "bg-status-amber/20 text-status-amber border-status-amber/30",
  Complete: "bg-status-low/20 text-status-low border-status-low/30",
};

const STATUS_ICONS: Record<QueueStatus, typeof Clock> = {
  Waiting: Clock,
  "In Session": AlertCircle,
  Complete: CheckCircle,
};

export function PharmacistPage() {
  const navigate = useNavigate();
  const { prescriptions, fulfillments } = usePrescriptionStore();
  const { getPatientStatus, initializeStatus } = usePatientQueueStore();

  // Initialize patient statuses on first load
  useEffect(() => {
    mockPatients.forEach((patient, idx) => {
      if (!getPatientStatus(patient.id)) {
        const defaultStatus = (["Waiting", "In Session", "Complete"][idx] as QueueStatus) || "Waiting";
        initializeStatus(patient.id, defaultStatus);
      }
    });
  }, [getPatientStatus, initializeStatus]);

  // Mock today's queue
  const todayQueue: QueueItem[] = useMemo(
    () =>
      mockPatients.map((patient, idx) => ({
        id: patient.id,
        name: patient.name,
        time:
          patient.appointmentTime?.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }) ?? `${9 + idx}:00 AM`,
        status: getPatientStatus(patient.id) || (["Waiting", "In Session", "Complete"][idx] as QueueStatus) || "Waiting",
      })),
    [getPatientStatus]
  );

  const sentToday = prescriptions.filter(
    (p) => new Date(p.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const awaitingApproval = prescriptions.filter(
    (p) => p.status === "pending_review"
  ).length;

  const fulfilledThisWeek = prescriptions.filter((p) => {
    const createdAt = new Date(p.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return p.status === "fulfilled" && createdAt >= weekAgo;
  }).length;

  return (
    <div className="min-h-screen bg-surface-base">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-primary-50 border-primary-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-800/20 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary-800">📤</span>
              </div>
              <div>
                <p className="text-xs font-medium text-text-tertiary">Sent Today</p>
                <p className="text-2xl font-bold text-primary-800">{sentToday}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-status-amber/5 border-status-amber/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-status-amber/20 flex items-center justify-center">
                <span className="text-lg font-semibold">⏳</span>
              </div>
              <div>
                <p className="text-xs font-medium text-text-tertiary">Awaiting Approval</p>
                <p className="text-2xl font-bold text-status-amber">{awaitingApproval}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-status-low/5 border-status-low/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-status-low/20 flex items-center justify-center">
                <span className="text-lg font-semibold">✅</span>
              </div>
              <div>
                <p className="text-xs font-medium text-text-tertiary">Fulfilled (7d)</p>
                <p className="text-2xl font-bold text-status-low">{fulfilledThisWeek}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Today's Queue */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Today's Queue</h2>
          <Card>
            {todayQueue.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">
                        Patient Name
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">
                        Appointment Time
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayQueue.map((item) => {
                      const StatusIcon = STATUS_ICONS[item.status];
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-border-default hover:bg-surface-raised transition-colors"
                        >
                          <td className="px-4 py-4 font-medium text-text-primary">
                            {item.name}
                          </td>
                          <td className="px-4 py-4 text-text-secondary text-sm">{item.time}</td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 w-fit rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_BADGE_STYLES[item.status]}`}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/pharmacist/session/${item.id}`)}
                            >
                              Start Session
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Pending Fulfillments */}
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">Pending Fulfillments</h2>
          <Card>
            {fulfillments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  No pending fulfillments from doctors
                </h3>
                <p className="text-sm text-text-secondary">
                  Fulfillment authorization notes from doctors will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {fulfillments.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start justify-between p-4 border border-border-default rounded-lg hover:bg-surface-raised transition-colors"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        Prescription from {note.prescriptionNoteId}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        Approved medication: {note.approvedMedication}
                      </p>
                    </div>
                    <Button variant="primary" size="sm">
                      Fulfill
                    </Button>
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
