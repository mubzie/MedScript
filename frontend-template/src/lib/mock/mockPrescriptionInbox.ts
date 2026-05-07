/**
 * Mock prescription inbox for doctor portal
 * These are prescriptions created by pharmacists in Phase 7
 */

export interface MockPrescriptionNote {
  id: string;
  patientId: string;
  patientName: string;
  patientIdAnonymized: string;
  pharmacistName: string;
  pharmacistId: string;
  pharmacistVerified: boolean;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  testResults: Array<{
    type: string;
    value: string;
    unit: string;
    referenceRange: string;
    flag: "normal" | "low" | "high";
  }>;
  pharmacistNotes: string;
  createdAt: Date;
  expiresAt: Date;
  status: "pending_review" | "approved" | "rejected";
}

export const mockPrescriptionInbox: MockPrescriptionNote[] = [
  {
    id: "note-1715058030000",
    patientId: "patient_001",
    patientName: "Alice Johnson",
    patientIdAnonymized: "pat***",
    pharmacistName: "Sarah Chen",
    pharmacistId: "0x962c393e4be8b7002d78783908a73e",
    pharmacistVerified: true,
    medication: "Amoxicillin",
    dosage: "500mg",
    frequency: "twice-daily",
    duration: "7 days",
    testResults: [
      {
        type: "Blood Pressure",
        value: "138/86",
        unit: "mmHg",
        referenceRange: "<120/80",
        flag: "high",
      },
      {
        type: "Heart Rate",
        value: "92",
        unit: "bpm",
        referenceRange: "60-100",
        flag: "normal",
      },
      {
        type: "Temperature",
        value: "38.5",
        unit: "°C",
        referenceRange: "36.5-37.5",
        flag: "high",
      },
      {
        type: "White Blood Cells",
        value: "7.2",
        unit: "K/uL",
        referenceRange: "4.5-11",
        flag: "normal",
      },
      {
        type: "Glucose",
        value: "85",
        unit: "mg/dL",
        referenceRange: "70-100",
        flag: "normal",
      },
    ],
    pharmacistNotes: "Patient reports mild fever for 3 days. Started symptoms Monday. No allergies.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: "pending_review",
  },
  {
    id: "note-1715058045000",
    patientId: "patient_002",
    patientName: "Bob Smith",
    patientIdAnonymized: "pat***",
    pharmacistName: "Sarah Chen",
    pharmacistId: "0x962c393e4be8b7002d78783908a73e",
    pharmacistVerified: true,
    medication: "Ibuprofen",
    dosage: "400mg",
    frequency: "every-6-hours",
    duration: "5 days",
    testResults: [
      {
        type: "Blood Pressure",
        value: "128/82",
        unit: "mmHg",
        referenceRange: "<120/80",
        flag: "normal",
      },
      {
        type: "Heart Rate",
        value: "88",
        unit: "bpm",
        referenceRange: "60-100",
        flag: "normal",
      },
      {
        type: "Temperature",
        value: "37.2",
        unit: "°C",
        referenceRange: "36.5-37.5",
        flag: "normal",
      },
      {
        type: "White Blood Cells",
        value: "6.8",
        unit: "K/uL",
        referenceRange: "4.5-11",
        flag: "normal",
      },
      {
        type: "Pain Level",
        value: "7",
        unit: "/10",
        referenceRange: "0-3",
        flag: "high",
      },
    ],
    pharmacistNotes: "Patient has lower back pain from gym injury. Recommend rest and medication.",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    status: "pending_review",
  },
  {
    id: "note-1715058060000",
    patientId: "patient_003",
    patientName: "Charlie Davis",
    patientIdAnonymized: "pat***",
    pharmacistName: "Sarah Chen",
    pharmacistId: "0x962c393e4be8b7002d78783908a73e",
    pharmacistVerified: true,
    medication: "Cetirizine",
    dosage: "10mg",
    frequency: "once-daily",
    duration: "14 days",
    testResults: [
      {
        type: "Blood Pressure",
        value: "120/78",
        unit: "mmHg",
        referenceRange: "<120/80",
        flag: "normal",
      },
      {
        type: "Heart Rate",
        value: "72",
        unit: "bpm",
        referenceRange: "60-100",
        flag: "normal",
      },
      {
        type: "Temperature",
        value: "36.8",
        unit: "°C",
        referenceRange: "36.5-37.5",
        flag: "normal",
      },
      {
        type: "IgE Antibodies",
        value: "156",
        unit: "IU/mL",
        referenceRange: "<100",
        flag: "high",
      },
      {
        type: "Eosinophils",
        value: "4.2",
        unit: "%",
        referenceRange: "1-4",
        flag: "low",
      },
    ],
    pharmacistNotes: "Seasonal allergies with nasal congestion. Recommend avoiding allergen triggers.",
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now - URGENT
    status: "pending_review",
  },
];
