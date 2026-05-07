import { create } from "zustand";
import type { PrescriptionNote, FulfillmentAuthorizationNote } from "@/types";
import { loadWorkflowState, saveWorkflowState } from "@/lib/workflowStorage";

interface PrescriptionStore {
  prescriptions: PrescriptionNote[];
  fulfillments: FulfillmentAuthorizationNote[];
  isLoading: boolean;
  error: string | null;

  // Prescription actions
  addPrescription: (prescription: PrescriptionNote) => void;
  updatePrescription: (id: string, updates: Partial<PrescriptionNote>) => void;
  removePrescription: (id: string) => void;
  getPrescriptionById: (id: string) => PrescriptionNote | undefined;

  // Fulfillment actions
  addFulfillment: (fulfillment: FulfillmentAuthorizationNote) => void;
  updateFulfillment: (id: string, updates: Partial<FulfillmentAuthorizationNote>) => void;
  removeFulfillment: (id: string) => void;
  getFulfillmentById: (id: string) => FulfillmentAuthorizationNote | undefined;

  // Utility actions
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

const initialWorkflowState = loadWorkflowState();

export const usePrescriptionStore = create<PrescriptionStore>((set, get) => ({
  prescriptions: initialWorkflowState.prescriptions,
  fulfillments: initialWorkflowState.fulfillments,
  isLoading: false,
  error: null,

  addPrescription: (prescription) =>
    set((state) => {
      const next = {
        prescriptions: [...state.prescriptions, prescription],
      };
      saveWorkflowState({
        prescriptions: next.prescriptions,
        fulfillments: state.fulfillments,
      });
      return next;
    }),

  updatePrescription: (id, updates) =>
    set((state) => {
      const next = {
        prescriptions: state.prescriptions.map((p) =>
          p.id === id ? { ...p, ...updates } : p,
        ),
      };
      saveWorkflowState({
        prescriptions: next.prescriptions,
        fulfillments: state.fulfillments,
      });
      return next;
    }),

  removePrescription: (id) =>
    set((state) => {
      const next = {
        prescriptions: state.prescriptions.filter((p) => p.id !== id),
      };
      saveWorkflowState({
        prescriptions: next.prescriptions,
        fulfillments: state.fulfillments,
      });
      return next;
    }),

  getPrescriptionById: (id) => {
    const state = get();
    return state.prescriptions.find((p) => p.id === id);
  },

  addFulfillment: (fulfillment) =>
    set((state) => {
      const next = {
        fulfillments: [...state.fulfillments, fulfillment],
      };
      saveWorkflowState({
        prescriptions: state.prescriptions,
        fulfillments: next.fulfillments,
      });
      return next;
    }),

  updateFulfillment: (id, updates) =>
    set((state) => {
      const next = {
        fulfillments: state.fulfillments.map((f) =>
          f.id === id ? { ...f, ...updates } : f,
        ),
      };
      saveWorkflowState({
        prescriptions: state.prescriptions,
        fulfillments: next.fulfillments,
      });
      return next;
    }),

  removeFulfillment: (id) =>
    set((state) => {
      const next = {
        fulfillments: state.fulfillments.filter((f) => f.id !== id),
      };
      saveWorkflowState({
        prescriptions: state.prescriptions,
        fulfillments: next.fulfillments,
      });
      return next;
    }),

  getFulfillmentById: (id) => {
    const state = get();
    return state.fulfillments.find((f) => f.id === id);
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  clear: () =>
    set(() => {
      const next = {
        prescriptions: [],
        fulfillments: [],
        isLoading: false,
        error: null,
      };
      saveWorkflowState({
        prescriptions: [],
        fulfillments: [],
      });
      return next;
    }),
}));
