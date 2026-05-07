import { create } from "zustand";

export type QueueStatus = "Waiting" | "In Session" | "Complete";

interface PatientQueueItem {
  patientId: string;
  status: QueueStatus;
}

interface PatientQueueStore {
  patientStatuses: Map<string, QueueStatus>;
  
  // Initialize with default statuses
  initializeStatus: (patientId: string, status: QueueStatus) => void;
  
  // Update a patient's status
  updatePatientStatus: (patientId: string, status: QueueStatus) => void;
  
  // Get a patient's status
  getPatientStatus: (patientId: string) => QueueStatus | undefined;
  
  // Clear all statuses
  clearStatuses: () => void;
}

export const usePatientQueueStore = create<PatientQueueStore>((set, get) => ({
  patientStatuses: new Map(),

  initializeStatus: (patientId, status) =>
    set((state) => {
      const newStatuses = new Map(state.patientStatuses);
      newStatuses.set(patientId, status);
      return { patientStatuses: newStatuses };
    }),

  updatePatientStatus: (patientId, status) =>
    set((state) => {
      const newStatuses = new Map(state.patientStatuses);
      newStatuses.set(patientId, status);
      return { patientStatuses: newStatuses };
    }),

  getPatientStatus: (patientId) => {
    const state = get();
    return state.patientStatuses.get(patientId);
  },

  clearStatuses: () => set({ patientStatuses: new Map() }),
}));
