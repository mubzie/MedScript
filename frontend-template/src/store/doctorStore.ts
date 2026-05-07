import { create } from "zustand";
import type { MockPrescriptionNote } from "@/lib/mock/mockPrescriptionInbox";

interface DoctorStore {
  prescriptionInbox: MockPrescriptionNote[];
  
  // Initialize inbox (called on page load)
  initializeInbox: (notes: MockPrescriptionNote[]) => void;
  
  // Update a prescription's status
  updatePrescriptionStatus: (noteId: string, status: "pending_review" | "approved" | "rejected") => void;
  
  // Get a prescription by ID
  getPrescriptionById: (noteId: string) => MockPrescriptionNote | undefined;
  
  // Get stats
  getStats: () => {
    receivedToday: number;
    pendingReview: number;
    approvedThisWeek: number;
  };
  
  // Clear store
  clearStore: () => void;
}

export const useDoctorStore = create<DoctorStore>((set, get) => ({
  prescriptionInbox: [],

  initializeInbox: (notes) =>
    set({
      prescriptionInbox: notes.map((n) => ({ ...n })),
    }),

  updatePrescriptionStatus: (noteId, status) =>
    set((state) => ({
      prescriptionInbox: state.prescriptionInbox.map((p) =>
        p.id === noteId ? { ...p, status } : p,
      ),
    })),

  getPrescriptionById: (noteId) => {
    const state = get();
    return state.prescriptionInbox.find((p) => p.id === noteId);
  },

  getStats: () => {
    const state = get();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const receivedToday = state.prescriptionInbox.filter(
      (p) => p.createdAt >= todayStart,
    ).length;

    const pendingReview = state.prescriptionInbox.filter(
      (p) => p.status === "pending_review",
    ).length;

    const approvedThisWeek = state.prescriptionInbox.filter(
      (p) => p.status === "approved" && p.createdAt >= weekAgo,
    ).length;

    return { receivedToday, pendingReview, approvedThisWeek };
  },

  clearStore: () =>
    set({
      prescriptionInbox: [],
    }),
}));
