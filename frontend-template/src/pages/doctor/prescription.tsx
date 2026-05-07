import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDoctorStore } from "@/store/doctorStore";
import { usePrescriptionStore } from "@/store/prescriptionStore";
import { midenClient } from "@/lib/miden/midenClient";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { ZKProofOverlay } from "@/components/shared/ZKProofOverlay";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal";
import { useToast } from "@/hooks/useToast";
import { buildTransactionExplorerUrl } from "@/lib/workflowStorage";
import type { FulfillmentAuthorizationNote } from "@/types";

type DecisionType = "approve" | "approve-modifications" | "reject" | null;

interface DecisionState {
  type: DecisionType;
  doctorNotes: string;
  rejectReason: string;
}

export function DoctorPrescriptionPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { getPrescriptionById, updatePrescriptionStatus } = useDoctorStore();
  const { updatePrescription, addFulfillment } = usePrescriptionStore();

  const prescription = useMemo(
    () => getPrescriptionById(noteId || ""),
    [getPrescriptionById, noteId],
  );

  const [showOverlay, setShowOverlay] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [decision, setDecision] = useState<DecisionState>({
    type: null,
    doctorNotes: "",
    rejectReason: "",
  });

  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
  const [authorizationNoteId, setAuthorizationNoteId] = useState("");
  const [approvalTxHash, setApprovalTxHash] = useState("");
  const isExpired = prescription ? prescription.expiresAt.getTime() < Date.now() : false;

  const statusBadgeType = useMemo(() => {
    if (!prescription) return "neutral" as const;
    if (prescription.status === "approved") return "normal" as const;
    if (prescription.status === "rejected") return "high" as const;
    return "amber" as const;
  }, [prescription]);

  if (!prescription) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Prescription not found</p>
          <Button onClick={() => navigate("/doctor")}>Back to Inbox</Button>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    if (isExpired) {
      showToast("This note is expired and cannot be approved.", "error");
      return;
    }
    setShowOverlay(true);
    try {
      const consumeTxHash = await midenClient.consumeNote(prescription.id);
      const fulfillment = await midenClient.approvePrescription({
        prescriptionNoteId: prescription.id,
        medication: prescription.medication,
        dosage: prescription.dosage,
        doctorNotes: decision.doctorNotes,
        isModified: decision.type === "approve-modifications",
      });

      const transactionHash = fulfillment.transactionId ?? consumeTxHash;

      const fulfillmentForStore: FulfillmentAuthorizationNote = {
        ...fulfillment,
        prescriptionNoteId: prescription.id,
        pharmacistId: prescription.pharmacistId,
        approvedMedication: prescription.medication,
        approvedDosage: prescription.dosage,
        doctorNotes: decision.doctorNotes,
        isModified: decision.type === "approve-modifications",
        status: "pending",
      };

      addFulfillment(fulfillmentForStore);
      setAuthorizationNoteId(fulfillment.id);
      setApprovalTxHash(transactionHash);
      updatePrescriptionStatus(prescription.id, "approved");
      updatePrescription(prescription.id, { status: "approved" });
      showToast("Prescription approved. Authorization sent to pharmacist.", "success");
      setShowApprovalConfirm(true);
    } catch {
      showToast("Failed to approve prescription", "error");
    } finally {
      setShowOverlay(false);
    }
  };

  const handleReject = async () => {
    if (isExpired) {
      showToast("This note is expired and cannot be rejected.", "error");
      return;
    }
    setShowRejectConfirm(false);
    setShowOverlay(true);
    try {
      await midenClient.rejectNote(prescription.id, decision.rejectReason);
      updatePrescriptionStatus(prescription.id, "rejected");
      updatePrescription(prescription.id, { status: "rejected" });
      showToast("Prescription rejected. Pharmacist notified.", "success");
      setTimeout(() => navigate("/doctor"), 1500);
    } catch {
      showToast("Failed to reject prescription", "error");
    } finally {
      setShowOverlay(false);
    }
  };

  const getExpiryColor = (expiresAt: Date) => {
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilExpiry < 24) return "text-red-600";
    if (hoursUntilExpiry < 48) return "text-amber-600";
    return "text-green-600";
  };

  const getExpiryText = (expiresAt: Date) => {
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilExpiry < 1) return "Expires in <1 hour";
    if (hoursUntilExpiry < 24) return `Expires in ${Math.round(hoursUntilExpiry)}h`;
    const daysUntilExpiry = Math.round(hoursUntilExpiry / 24);
    return `Expires in ${daysUntilExpiry}d`;
  };

  return (
    <div className="min-h-screen bg-surface-base">
      <ZKProofOverlay visible={showOverlay} />
      <ConfirmationModal
        isOpen={showRejectConfirm}
        title="Reject Prescription?"
        message="This will notify the pharmacist that you've rejected this prescription."
        confirmText="Reject"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleReject}
        onCancel={() => setShowRejectConfirm(false)}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/doctor")}
            className="mb-4"
          >
            ← Back to Inbox
          </Button>
          <h1 className="text-3xl font-bold text-text-primary">
            Review Prescription
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Prescription Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-text-tertiary">Note ID</p>
                  <p className="font-mono text-sm text-text-primary">{prescription.id}</p>
                </div>
                <Badge type={statusBadgeType}>{prescription.status}</Badge>
              </div>
              <div className={`text-sm font-medium ${getExpiryColor(prescription.expiresAt)}`}>
                {getExpiryText(prescription.expiresAt)}
              </div>
              {isExpired && (
                <p className="text-xs text-status-high mt-2">Expired note — review actions disabled.</p>
              )}
            </Card>

            {/* Pharmacist Info */}
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">From Pharmacist</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-text-tertiary">Pharmacist Name</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-text-primary font-medium">{prescription.pharmacistName}</p>
                    {prescription.pharmacistVerified && (
                      <span className="text-xs text-green-600">✓ Verified</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-tertiary">Account ID</p>
                  <p className="font-mono text-sm text-text-primary">{prescription.pharmacistId}</p>
                </div>
              </div>
            </Card>

            {/* Patient Info */}
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Patient</h2>
              <div>
                <p className="text-xs font-medium text-text-tertiary">Patient ID (Anonymized)</p>
                <p className="text-text-primary font-medium">{prescription.patientIdAnonymized}</p>
              </div>
            </Card>

            {/* Test Results */}
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Test Results</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {prescription.testResults.map((result, idx) => (
                  <div key={idx} className="pb-3 border-b border-border-default last:border-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-text-primary">{result.type}</p>
                      <Badge type={result.flag as "normal" | "low" | "high"}>{result.flag}</Badge>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {result.value} {result.unit}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      Range: {result.referenceRange}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Prescription Details */}
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Medication</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-text-tertiary">Medication</p>
                  <p className="text-text-primary font-medium">{prescription.medication}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-text-tertiary">Dosage</p>
                    <p className="text-text-primary font-medium">{prescription.dosage}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-tertiary">Frequency</p>
                    <p className="text-text-primary font-medium">{prescription.frequency}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-tertiary">Duration</p>
                  <p className="text-text-primary font-medium">{prescription.duration}</p>
                </div>
              </div>
            </Card>

            {/* Pharmacist Notes */}
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Pharmacist Notes</h2>
              <p className="text-sm text-text-primary bg-surface-sunken p-3 rounded-lg">
                {prescription.pharmacistNotes}
              </p>
            </Card>
          </div>

          {/* Right Column: Decision Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Your Decision</h2>

              {/* Decision Toggles */}
              <div className="space-y-2 mb-6">
                <button
                  onClick={() => setDecision({ ...decision, type: "approve" })}
                  className={`w-full px-3 py-2 rounded-lg border-2 transition-colors ${
                    decision.type === "approve"
                      ? "border-green-600 bg-green-50 text-green-900"
                      : "border-border-default bg-surface-base text-text-primary"
                  }`}
                >
                  Approve as written
                </button>
                <button
                  onClick={() => setDecision({ ...decision, type: "approve-modifications" })}
                  className={`w-full px-3 py-2 rounded-lg border-2 transition-colors ${
                    decision.type === "approve-modifications"
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-border-default bg-surface-base text-text-primary"
                  }`}
                >
                  Approve with notes
                </button>
                <button
                  onClick={() => setDecision({ ...decision, type: "reject" })}
                  className={`w-full px-3 py-2 rounded-lg border-2 transition-colors ${
                    decision.type === "reject"
                      ? "border-red-600 bg-red-50 text-red-900"
                      : "border-border-default bg-surface-base text-text-primary"
                  }`}
                >
                  Reject
                </button>
              </div>

              {/* Conditional Sections */}
              {decision.type === "approve" && (
                <div className="space-y-4 pb-4 border-t border-border-default">
                  <div className="pt-4">
                    <label className="block text-xs font-medium text-text-tertiary mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={decision.doctorNotes}
                      onChange={(e) => setDecision({ ...decision, doctorNotes: e.target.value })}
                      placeholder="Add any notes for the pharmacist..."
                      className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                      rows={3}
                    />
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleApprove}
                    disabled={isExpired}
                  >
                    Approve & Send Authorization
                  </Button>
                </div>
              )}

              {decision.type === "approve-modifications" && (
                <div className="space-y-4 pb-4 border-t border-border-default">
                  <div className="pt-4">
                    <label className="block text-xs font-medium text-text-tertiary mb-2">
                      Doctor Notes (Required)
                    </label>
                    <textarea
                      value={decision.doctorNotes}
                      onChange={(e) => setDecision({ ...decision, doctorNotes: e.target.value })}
                      placeholder="Explain your modifications..."
                      className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                      rows={3}
                    />
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleApprove}
                    disabled={!decision.doctorNotes.trim() || isExpired}
                  >
                    Approve with Notes & Send
                  </Button>
                </div>
              )}

              {decision.type === "reject" && (
                <div className="space-y-4 pb-4 border-t border-border-default">
                  <div className="pt-4">
                    <label className="block text-xs font-medium text-text-tertiary mb-2">
                      Reason for Rejection (Required)
                    </label>
                    <textarea
                      value={decision.rejectReason}
                      onChange={(e) => setDecision({ ...decision, rejectReason: e.target.value })}
                      placeholder="Why are you rejecting this prescription?"
                      className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                      rows={3}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={!decision.rejectReason.trim() || isExpired}
                  >
                    Send Rejection
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Approval Confirmation Modal */}
        {showApprovalConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="max-w-sm">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  Authorization Sent
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  to {prescription.pharmacistName}
                </p>
                <div className="bg-surface-sunken p-3 rounded-lg mb-6 text-left">
                  <p className="text-xs font-medium text-text-tertiary">Authorization Note ID</p>
                  <p className="font-mono text-sm text-text-primary">{authorizationNoteId}</p>
                </div>
                {approvalTxHash && (
                  <div className="bg-surface-sunken p-3 rounded-lg mb-6 text-left space-y-2">
                    <p className="text-xs font-medium text-text-tertiary">Transaction Hash</p>
                    <p className="font-mono text-sm text-text-primary break-all">{approvalTxHash}</p>
                    <a
                      href={buildTransactionExplorerUrl(approvalTxHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-sm font-medium text-primary-800 hover:underline"
                    >
                      View on explorer
                    </a>
                  </div>
                )}
                <div className="bg-green-50 p-3 rounded-lg mb-6 text-left border border-green-200">
                  <p className="text-sm font-medium text-green-900">{prescription.medication} {prescription.dosage}</p>
                  <p className="text-xs text-green-800">{prescription.frequency} for {prescription.duration}</p>
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate("/doctor")}
                >
                  Return to Inbox
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
