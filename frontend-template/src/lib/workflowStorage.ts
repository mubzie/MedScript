import { EXPLORER_BASE_URL } from "@/config";
import type {
  FulfillmentAuthorizationNote,
  PrescriptionNote,
} from "@/types";
import type { QueueStatus } from "@/store/patientQueueStore";

const WORKFLOW_STORAGE_KEY = "medscript:workflow:v1";
const QUEUE_STORAGE_KEY = "medscript:queue:v1";

interface StoredPrescriptionNote
  extends Omit<PrescriptionNote, "createdAt" | "expiresAt"> {
  createdAt: string;
  expiresAt: string;
}

interface StoredFulfillmentNote
  extends Omit<FulfillmentAuthorizationNote, "createdAt"> {
  createdAt: string;
}

interface StoredWorkflowState {
  prescriptions: StoredPrescriptionNote[];
  fulfillments: StoredFulfillmentNote[];
}

type StoredQueueState = Array<[string, QueueStatus]>;

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function revivePrescription(note: StoredPrescriptionNote): PrescriptionNote {
  return {
    ...note,
    createdAt: new Date(note.createdAt),
    expiresAt: new Date(note.expiresAt),
  };
}

function reviveFulfillment(note: StoredFulfillmentNote): FulfillmentAuthorizationNote {
  return {
    ...note,
    createdAt: new Date(note.createdAt),
  };
}

function serializePrescription(note: PrescriptionNote): StoredPrescriptionNote {
  return {
    ...note,
    createdAt: note.createdAt.toISOString(),
    expiresAt: note.expiresAt.toISOString(),
  };
}

function serializeFulfillment(note: FulfillmentAuthorizationNote): StoredFulfillmentNote {
  return {
    ...note,
    createdAt: note.createdAt.toISOString(),
  };
}

function readJson<T>(key: string): T | null {
  if (!hasStorage()) return null;

  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to read ${key} from localStorage:`, error);
    window.localStorage.removeItem(key);
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!hasStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadWorkflowState(): {
  prescriptions: PrescriptionNote[];
  fulfillments: FulfillmentAuthorizationNote[];
} {
  const state = readJson<StoredWorkflowState>(WORKFLOW_STORAGE_KEY);

  if (!state) {
    return {
      prescriptions: [],
      fulfillments: [],
    };
  }

  return {
    prescriptions: state.prescriptions.map(revivePrescription),
    fulfillments: state.fulfillments.map(reviveFulfillment),
  };
}

export function saveWorkflowState(state: {
  prescriptions: PrescriptionNote[];
  fulfillments: FulfillmentAuthorizationNote[];
}) {
  writeJson(WORKFLOW_STORAGE_KEY, {
    prescriptions: state.prescriptions.map(serializePrescription),
    fulfillments: state.fulfillments.map(serializeFulfillment),
  });
}

export function loadPatientQueueState(): Map<string, QueueStatus> {
  const state = readJson<StoredQueueState>(QUEUE_STORAGE_KEY);
  return new Map(state ?? []);
}

export function savePatientQueueState(statuses: Map<string, QueueStatus>) {
  writeJson(QUEUE_STORAGE_KEY, Array.from(statuses.entries()));
}

export function buildAccountExplorerUrl(accountId: string) {
  return `${EXPLORER_BASE_URL}/account/${accountId}`;
}

export function buildTransactionExplorerUrl(transactionHash: string) {
  return `${EXPLORER_BASE_URL}/transaction/${transactionHash}`;
}
