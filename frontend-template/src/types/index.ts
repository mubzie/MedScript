// Account types
export type Network = "testnet" | "localnet";
export type AccountType = "pharmacist" | "doctor" | "patient";

export interface MidenAccount {
  id: string;
  type: AccountType;
  credentialHash: string;
  isVerified: boolean;
  network: Network;
  publicKey?: string;
}

// Prescription workflow types
export type PrescriptionStatus =
  | "draft"
  | "in_transit"
  | "pending_review"
  | "approved"
  | "modified"
  | "rejected"
  | "fulfilled"
  | "expired";

export interface PrescriptionNote {
  id: string;
  patientId: string;
  pharmacistId: string;
  doctorId?: string;
  testResultsHash: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  pharmacistNotes: string;
  status: PrescriptionStatus;
  createdAt: Date;
  expiresAt: Date;
}

export interface FulfillmentAuthorizationNote {
  id: string;
  prescriptionNoteId: string;
  doctorId: string;
  pharmacistId: string;
  approvedMedication: string;
  approvedDosage: string;
  doctorNotes: string;
  isModified: boolean;
  status: "pending" | "approved" | "consumed";
  createdAt: Date;
}

// Patient and test result types
export type TestResultFlag = "normal" | "low" | "high";

export interface TestResult {
  type: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  flag: TestResultFlag;
  testedAt: Date;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  bloodType: string;
  appointmentTime?: Date;
  testResults: TestResult[];
}

// Wallet and UI state types
export interface WalletState {
  connected: boolean;
  account: MidenAccount | null;
  connecting: boolean;
  error: string | null;
}

export interface StoreState {
  // Common
  isLoading: boolean;
  error: string | null;

  // Wallet
  wallet: WalletState;

  // Prescriptions
  prescriptions: PrescriptionNote[];
  fulfillments: FulfillmentAuthorizationNote[];
}

// Request/Response types
export interface CreatePrescriptionRequest {
  patientId: string;
  doctorId: string;
  testResultsHash: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
  expiryDays: number;
}

export interface ApprovePrescriptionRequest {
  prescriptionNoteId: string;
  medication: string;
  dosage: string;
  doctorNotes: string;
  isModified: boolean;
}

export interface RejectPrescriptionRequest {
  prescriptionNoteId: string;
  reason: string;
}
