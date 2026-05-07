import { create } from "zustand";
import { loadPatientQueueState, savePatientQueueState } from "@/lib/workflowStorage";

export type QueueStatus = "Waiting" | "In Session" | "Complete";

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

const initialPatientStatuses = loadPatientQueueState();

export const usePatientQueueStore = create<PatientQueueStore>((set, get) => ({
  patientStatuses: initialPatientStatuses,

  initializeStatus: (patientId, status) =>
    set((state) => {
      const newStatuses = new Map(state.patientStatuses);
      newStatuses.set(patientId, status);
      savePatientQueueState(newStatuses);
      return { patientStatuses: newStatuses };
    }),

  updatePatientStatus: (patientId, status) =>
    set((state) => {
      const newStatuses = new Map(state.patientStatuses);
      newStatuses.set(patientId, status);
      savePatientQueueState(newStatuses);
      return { patientStatuses: newStatuses };
    }),

  getPatientStatus: (patientId) => {
    const state = get();
    return state.patientStatuses.get(patientId);
  },

  clearStatuses: () =>
    set(() => {
      const next = new Map<string, QueueStatus>();
      savePatientQueueState(next);
      return { patientStatuses: next };
    }),
}));
