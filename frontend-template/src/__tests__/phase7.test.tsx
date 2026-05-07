import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PharmacistSessionPage } from "@/pages/pharmacist/session";
import { PharmacistSuccessPage } from "@/pages/pharmacist/success";
import { usePatientQueueStore } from "@/store/patientQueueStore";
import { usePrescriptionStore } from "@/store/prescriptionStore";
import type { PrescriptionNote } from "@/types";

const mockCreatePrescriptionNote = vi.fn();
const mockSendNoteToDoctor = vi.fn();

vi.mock("@/lib/miden/midenClient", () => ({
  midenClient: {
    createPrescriptionNote: (...args: unknown[]) => mockCreatePrescriptionNote(...args),
    sendNoteToDoctor: (...args: unknown[]) => mockSendNoteToDoctor(...args),
  },
}));

function renderSession(patientId = "patient_001") {
  return render(
    <MemoryRouter initialEntries={[`/pharmacist/session/${patientId}`]}>
      <Routes>
        <Route path="/pharmacist/session/:patientId" element={<PharmacistSessionPage />} />
        <Route path="/pharmacist/success" element={<PharmacistSuccessPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function progressToSend(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /dr\. rebecca mitchell/i }));
  await user.click(screen.getByRole("button", { name: /^next$/i }));

  await user.type(screen.getByPlaceholderText(/e\.g\., aspirin/i), "Amoxicillin");
  await user.type(screen.getByPlaceholderText(/e\.g\., 500/i), "500");
  await user.type(screen.getByPlaceholderText(/e\.g\., 7/i), "7");
  await user.click(screen.getByRole("button", { name: /^next$/i }));

  await user.type(screen.getByPlaceholderText(/provide any clinical context/i), "Follow up in one week.");
  await user.click(screen.getByRole("button", { name: /^next$/i }));
}

function makePrescriptionNote(id = "note-123"): PrescriptionNote {
  return {
    id,
    patientId: "patient_001",
    pharmacistId: "0x962c393e4be8b7002d78783908a73e",
    doctorId: "0xce9a185139464d0077efb96d6dfaa3",
    testResultsHash: "0x" + "a".repeat(64),
    medication: "Amoxicillin",
    dosage: "500mg",
    frequency: "daily",
    duration: "7days",
    pharmacistNotes: "Follow up in one week.",
    status: "in_transit",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}

describe("Phase 7: Pharmacist workflow", () => {
  beforeEach(() => {
    usePrescriptionStore.setState({
      prescriptions: [],
      fulfillments: [],
      isLoading: false,
      error: null,
    });
    usePatientQueueStore.setState({ patientStatuses: new Map() });
    usePatientQueueStore.getState().updatePatientStatus("patient_001", "Waiting");
    vi.clearAllMocks();
  });

  it("progresses correctly through the 4-step form", async () => {
    const user = userEvent.setup();
    renderSession();

    expect(screen.getByText("Select Doctor")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /dr\. rebecca mitchell/i }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText("Medication Details")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/e\.g\., aspirin/i), "Amoxicillin");
    await user.type(screen.getByPlaceholderText(/e\.g\., 500/i), "500");
    await user.type(screen.getByPlaceholderText(/e\.g\., 7/i), "7");
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText("Notes for Doctor")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/provide any clinical context/i), "Follow up in one week.");
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText("Review & Send")).toBeInTheDocument();
  });

  it("shows ZKProofOverlay during send", async () => {
    const user = userEvent.setup();
    mockCreatePrescriptionNote.mockReturnValue(new Promise(() => {}));
    renderSession();

    await progressToSend(user);
    await user.click(screen.getByRole("button", { name: /send prescription note/i }));

    expect(screen.getByText(/generating zero-knowledge proof/i)).toBeInTheDocument();
  });

  it("shows confirmation screen after successful send", async () => {
    const user = userEvent.setup();
    mockCreatePrescriptionNote.mockResolvedValue(makePrescriptionNote("note-999"));
    mockSendNoteToDoctor.mockResolvedValue("tx_123");
    renderSession();

    await progressToSend(user);
    await user.click(screen.getByRole("button", { name: /send prescription note/i }));

    await waitFor(() => {
      expect(screen.getByText("Prescription Note Sent")).toBeInTheDocument();
      expect(screen.getByText(/prescription note sent to/i)).toBeInTheDocument();
      expect(screen.getByText("note-999")).toBeInTheDocument();
    });
  });

  it("updates patient status to Complete after send", async () => {
    const user = userEvent.setup();
    mockCreatePrescriptionNote.mockResolvedValue(makePrescriptionNote("note-777"));
    mockSendNoteToDoctor.mockResolvedValue("tx_456");
    renderSession();

    await progressToSend(user);
    await user.click(screen.getByRole("button", { name: /send prescription note/i }));

    await waitFor(() => {
      expect(usePatientQueueStore.getState().getPatientStatus("patient_001")).toBe("Complete");
    });
  });
});
