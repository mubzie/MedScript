export interface Doctor {
  id: string;
  midenAccountId: string;
  name: string;
  specialty: string;
  clinicName: string;
  licenseNumber: string;
  isVerified: boolean;
  availability: string[];
}

export const mockDoctors: Doctor[] = [
  {
    id: "doctor_001",
    midenAccountId: "0xce9a185139464d0077efb96d6dfaa3",
    name: "Dr. Rebecca Mitchell",
    specialty: "Cardiology",
    clinicName: "Heart Health Center",
    licenseNumber: "MD-12345",
    isVerified: true,
    availability: ["Monday", "Tuesday", "Wednesday", "Thursday"],
  },
  {
    id: "doctor_002",
    midenAccountId: "0x7f2b4c8d9e1a3f5c6b8d9e1a3f5c6b",
    name: "Dr. James Patterson",
    specialty: "Endocrinology",
    clinicName: "Diabetes Management Clinic",
    licenseNumber: "MD-54321",
    isVerified: true,
    availability: ["Tuesday", "Wednesday", "Thursday", "Friday"],
  },
  {
    id: "doctor_003",
    midenAccountId: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
    name: "Dr. Emily Rodriguez",
    specialty: "Internal Medicine",
    clinicName: "Primary Care Plus",
    licenseNumber: "MD-67890",
    isVerified: true,
    availability: ["Monday", "Wednesday", "Friday"],
  },
  {
    id: "doctor_004",
    midenAccountId: "0xf5e4d3c2b1a0f9e8d7c6b5a49384756",
    name: "Dr. David Thompson",
    specialty: "Nephrology",
    clinicName: "Kidney Care Institute",
    licenseNumber: "MD-11111",
    isVerified: true,
    availability: ["Monday", "Tuesday", "Thursday", "Friday"],
  },
  {
    id: "doctor_005",
    midenAccountId: "0x9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4",
    name: "Dr. Lisa Chen",
    specialty: "Rheumatology",
    clinicName: "Inflammation Treatment Center",
    licenseNumber: "MD-22222",
    isVerified: true,
    availability: ["Tuesday", "Wednesday", "Thursday", "Friday"],
  },
];
