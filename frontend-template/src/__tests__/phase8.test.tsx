import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DoctorPage } from "@/pages/doctor";
import { DoctorPrescriptionPage } from "@/pages/doctor/prescription";
import { useDoctorStore } from "@/store/doctorStore";
import { usePrescriptionStore } from "@/store/prescriptionStore";
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

function createPrescription(id: string): PrescriptionNote {
  return {
    id,
    patientId: "patient_001",
    pharmacistId: "0x962c393e4be8b7002d78783908a73e",
    doctorId: "0xce9a185139464d0077efb96d6dfaa3",
    testResultsHash: "0x" + "a".repeat(64),
    medication: "Amoxicillin",
    dosage: "500mg",
    frequency: "twice-daily",
    duration: "7 days",
    pharmacistNotes: "Take after meals.",
    status: "pending_review",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  };
}

describe("Phase 8: Doctor workflow", () => {
  beforeEach(() => {
    useDoctorStore.setState({ prescriptionInbox: [] });
    usePrescriptionStore.setState({
      prescriptions: [],
      fulfillments: [],
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it("shows pharmacist-sent prescriptions in doctor inbox", async () => {
    usePrescriptionStore.getState().addPrescription(createPrescription("note-phase8-1"));

    render(
      <MemoryRouter>
        <DoctorPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/amoxicillin 500mg/i)).toBeInTheDocument();
      expect(screen.getByText(/prescription inbox/i)).toBeInTheDocument();
    });
  });

  it("approving a prescription updates status and creates fulfillment", async () => {
    const user = userEvent.setup();
    const prescription = createPrescription("note-phase8-2");
    usePrescriptionStore.getState().addPrescription(prescription);
    useDoctorStore.getState().initializeInbox([
      {
        id: prescription.id,
        patientId: prescription.patientId,
        patientName: "John Anderson",
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
      doctorId: "doctor_1",
      pharmacistId: prescription.pharmacistId,
      approvedMedication: prescription.medication,
      approvedDosage: prescription.dosage,
      doctorNotes: "Reviewed",
      isModified: false,
      status: "approved",
      createdAt: new Date(),
    });

    render(
      <MemoryRouter initialEntries={[`/doctor/prescription/${prescription.id}`]}>
        <Routes>
          <Route path="/doctor/prescription/:noteId" element={<DoctorPrescriptionPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /approve as written/i }));
    await user.click(screen.getByRole("button", { name: /approve & send authorization/i }));

    await waitFor(() => {
      expect(screen.getByText(/authorization sent/i)).toBeInTheDocument();
      expect(useDoctorStore.getState().getPrescriptionById(prescription.id)?.status).toBe("approved");
      expect(usePrescriptionStore.getState().getPrescriptionById(prescription.id)?.status).toBe("approved");
      expect(usePrescriptionStore.getState().fulfillments).toHaveLength(1);
    });
  });

  it("rejecting a prescription updates both stores", async () => {
    const user = userEvent.setup();
    const prescription = createPrescription("note-phase8-3");
    usePrescriptionStore.getState().addPrescription(prescription);
    useDoctorStore.getState().initializeInbox([
      {
        id: prescription.id,
        patientId: prescription.patientId,
        patientName: "John Anderson",
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

    mockRejectNote.mockResolvedValue("tx_reject_1");

    render(
      <MemoryRouter initialEntries={[`/doctor/prescription/${prescription.id}`]}>
        <Routes>
          <Route path="/doctor/prescription/:noteId" element={<DoctorPrescriptionPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /^reject$/i }));
    await user.type(screen.getByPlaceholderText(/why are you rejecting/i), "Contraindicated.");
    await user.click(screen.getByRole("button", { name: /send rejection/i }));
    const rejectButtons = screen.getAllByRole("button", { name: /^reject$/i });
    await user.click(rejectButtons[0]);

    await waitFor(() => {
      expect(useDoctorStore.getState().getPrescriptionById(prescription.id)?.status).toBe("rejected");
      expect(usePrescriptionStore.getState().getPrescriptionById(prescription.id)?.status).toBe("rejected");
    });
  });
});
