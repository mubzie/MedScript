import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { buildTransactionExplorerUrl } from "@/lib/workflowStorage";

interface SuccessState {
  doctorName: string;
  noteId: string;
  txHash?: string;
}

export function PharmacistSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as SuccessState | undefined;
  const doctorDisplayName = state?.doctorName.replace(/^Dr\.\s*/i, "");

  if (!state) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Button variant="primary" onClick={() => navigate("/pharmacist")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-status-normal mx-auto" />
        </div>

        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Prescription Note Sent
        </h1>

        <p className="text-lg text-text-secondary mb-6">
          Prescription note sent to <strong>Dr. {doctorDisplayName}</strong>
        </p>

        <div className="bg-surface-sunken rounded-lg p-6 mb-6">
          <p className="text-xs font-medium text-text-tertiary mb-2">Note ID</p>
          <p className="font-mono text-sm text-text-primary break-all">{state.noteId}</p>
        </div>

        {state.txHash && (
          <div className="bg-surface-sunken rounded-lg p-6 mb-6 text-left space-y-2">
            <p className="text-xs font-medium text-text-tertiary">Transaction Hash</p>
            <p className="font-mono text-sm text-text-primary break-all">{state.txHash}</p>
            <a
              href={buildTransactionExplorerUrl(state.txHash)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-medium text-primary-800 hover:underline"
            >
              View on explorer
            </a>
          </div>
        )}

        <p className="text-text-secondary mb-8">
          Instruct the patient to visit Dr. {doctorDisplayName} with the note ID for approval.
        </p>

        <Button variant="primary" onClick={() => navigate("/pharmacist")} className="w-full">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
