import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { PatientPage } from "@/pages/patient";
import { PharmacistSuccessPage } from "@/pages/pharmacist/success";
import { DoctorPrescriptionPage } from "@/pages/doctor/prescription";
import { useDoctorStore } from "@/store/doctorStore";
import { usePrescriptionStore } from "@/store/prescriptionStore";
import { loadWorkflowState } from "@/lib/workflowStorage";
import type { PrescriptionNote } from "@/types";

const mockConsumeNote = vi.fn();
const mockApprovePrescription = vi.fn();
const mockRejectNote = vi.fn();

vi.mock("@/lib/miden/midenClient", () => ({
  midenClient: {
    consumeNote: (...args: unknown[]) => mockConsumeNote(...args),
    approvePrescription: (...args: unknown[]) => mockApprovePrescription(...args),
    rejectNote: (...args: unknown[]) => mockRejectNote(...args),
  },
}));

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

function makePrescription(overrides: Partial<PrescriptionNote> = {}): PrescriptionNote {
  return {
    id: "note-phase9",
    patientId: "patient_001",
    pharmacistId: "0x962c393e4be8b7002d78783908a73e",
    doctorId: "doctor_001",
    testResultsHash: "0x" + "a".repeat(64),
    medication: "Amoxicillin",
    dosage: "500mg",
    frequency: "daily",
    duration: "7 days",
    pharmacistNotes: "Take after meals.",
    status: "fulfilled",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

describe("Phase 9: Final integration", () => {
  beforeEach(() => {
    localStorage.clear();
    useDoctorStore.setState({ prescriptionInbox: [] });
    usePrescriptionStore.setState({
      prescriptions: [],
      fulfillments: [],
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it("shows the patient timeline and summary for a fulfilled prescription", () => {
    usePrescriptionStore.setState({
      prescriptions: [
        makePrescription({
          status: "fulfilled",
          doctorId: "doctor_001",
        }),
      ],
      fulfillments: [],
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/patient"]}>
        <Routes>
          <Route path="/patient" element={<PatientPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Ready to Collect").length).toBeGreaterThan(0);
    expect(screen.getByText(/return to heart health center/i)).toBeInTheDocument();
    expect(screen.getByText("Prescription Summary")).toBeInTheDocument();
  });

  it("shows tx hash and explorer link on the pharmacist success screen", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/pharmacist/success",
            state: {
              doctorName: "Dr. Rebecca Mitchell",
              noteId: "note-123",
              txHash: "tx_abc123",
            },
          },
        ]}
      >
        <Routes>
          <Route path="/pharmacist/success" element={<PharmacistSuccessPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /view on explorer/i });
    expect(link).toHaveAttribute(
      "href",
      "https://testnet.midenscan.com/transaction/tx_abc123",
    );
  });

  it("shows approval transaction details after doctor approval", async () => {
    const user = userEvent.setup();
    const prescription = makePrescription({
      status: "pending_review",
      doctorId: "doctor_001",
    });

    usePrescriptionStore.getState().addPrescription(prescription);
    useDoctorStore.getState().initializeInbox([
      {
        id: prescription.id,
        patientId: prescription.patientId,
        patientName: "Alice Johnson",
        patientIdAnonymized: "pat***",
        pharmacistName: "Sarah Chen",
        pharmacistId: prescription.pharmacistId,
        pharmacistVerified: true,
        medication: prescription.medication,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration: prescription.duration,
        testResults: [],
        pharmacistNotes: prescription.pharmacistNotes,
        createdAt: prescription.createdAt,
        expiresAt: prescription.expiresAt,
        status: "pending_review",
      },
    ]);

    mockConsumeNote.mockResolvedValue("tx_consume_1");
    mockApprovePrescription.mockResolvedValue({
      id: "fulfillment-note-1",
      prescriptionNoteId: prescription.id,
      doctorId: "doctor_001",
      pharmacistId: prescription.pharmacistId,
      approvedMedication: prescription.medication,
      approvedDosage: prescription.dosage,
      doctorNotes: "Reviewed",
      isModified: false,
      status: "approved",
      createdAt: new Date(),
      transactionId: "tx_approve_1",
    });

    renderWithToast(
      <MemoryRouter initialEntries={[`/doctor/prescription/${prescription.id}`]}>
        <Routes>
          <Route path="/doctor/prescription/:noteId" element={<DoctorPrescriptionPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /approve as written/i }));
    await user.click(screen.getByRole("button", { name: /approve & send authorization/i }));

    await waitFor(() => {
      expect(screen.getByText("Authorization Sent")).toBeInTheDocument();
      expect(screen.getByText("tx_approve_1")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /view on explorer/i })).toHaveAttribute(
        "href",
        "https://testnet.midenscan.com/transaction/tx_approve_1",
      );
    });
  });

  it("ignores malformed persisted workflow state", () => {
    localStorage.setItem("medscript:workflow:v1", "{not-json");

    expect(loadWorkflowState()).toEqual({
      prescriptions: [],
      fulfillments: [],
    });
  });
});
