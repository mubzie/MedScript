import { create } from "zustand";
import type { PrescriptionNote, FulfillmentAuthorizationNote } from "@/types";

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

export const usePrescriptionStore = create<PrescriptionStore>((set, get) => ({
  prescriptions: [],
  fulfillments: [],
  isLoading: false,
  error: null,

  addPrescription: (prescription) =>
    set((state) => ({
      prescriptions: [...state.prescriptions, prescription],
    })),

  updatePrescription: (id, updates) =>
    set((state) => ({
      prescriptions: state.prescriptions.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),

  removePrescription: (id) =>
    set((state) => ({
      prescriptions: state.prescriptions.filter((p) => p.id !== id),
    })),

  getPrescriptionById: (id) => {
    const state = get();
    return state.prescriptions.find((p) => p.id === id);
  },

  addFulfillment: (fulfillment) =>
    set((state) => ({
      fulfillments: [...state.fulfillments, fulfillment],
    })),

  updateFulfillment: (id, updates) =>
    set((state) => ({
      fulfillments: state.fulfillments.map((f) =>
        f.id === id ? { ...f, ...updates } : f,
      ),
    })),

  removeFulfillment: (id) =>
    set((state) => ({
      fulfillments: state.fulfillments.filter((f) => f.id !== id),
    })),

  getFulfillmentById: (id) => {
    const state = get();
    return state.fulfillments.find((f) => f.id === id);
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  clear: () =>
    set({
      prescriptions: [],
      fulfillments: [],
      isLoading: false,
      error: null,
    }),
}));
