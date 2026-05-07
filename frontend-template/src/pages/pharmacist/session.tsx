import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockPatients } from "@/lib/mock/mockPatients";
import { mockDoctors } from "@/lib/mock/mockDoctors";
import { usePrescriptionStore } from "@/store/prescriptionStore";
import { usePatientQueueStore } from "@/store/patientQueueStore";
import { midenClient } from "@/lib/miden/midenClient";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { ZKProofOverlay } from "@/components/shared/ZKProofOverlay";
import { useToast } from "@/hooks/useToast";
import { ChevronRight, Search, AlertCircle } from "lucide-react";

interface FormState {
  doctorId: string;
  medicationName: string;
  dosage: string;
  dosageUnit: "mg" | "ml" | "units";
  frequency: string;
  duration: string;
  durationUnit: "days" | "weeks";
  notes: string;
}

type Step = 1 | 2 | 3 | 4;

export function PharmacistSessionPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addPrescription } = usePrescriptionStore();
  const { updatePatientStatus, getPatientStatus } = usePatientQueueStore();

  const patient = useMemo(
    () => mockPatients.find((p) => p.id === patientId),
    [patientId]
  );

  const patientStatus = getPatientStatus(patientId || "");
  const isSessionComplete = patientStatus === "Complete";

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [showOverlay, setShowOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formState, setFormState] = useState<FormState>({
    doctorId: "",
    medicationName: "",
    dosage: "",
    dosageUnit: "mg",
    frequency: "daily",
    duration: "",
    durationUnit: "days",
    notes: "",
  });

  const filteredDoctors = useMemo(
    () =>
      mockDoctors.filter((doc) =>
        `${doc.name} ${doc.specialty}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const selectedDoctor = mockDoctors.find((d) => d.id === formState.doctorId);

  const handleNextStep = useCallback(() => {
    if (currentStep === 1 && !formState.doctorId) {
      showToast("Please select a doctor", "error");
      return;
    }
    if (currentStep === 2) {
      if (!formState.medicationName || !formState.dosage || !formState.duration) {
        showToast("Please fill in all medication details", "error");
        return;
      }
    }
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  }, [currentStep, formState, showToast]);

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSend = async () => {
    if (!patient || !selectedDoctor) return;

    setShowOverlay(true);
    try {
      // Call midenClient stubs (will simulate 2s delay)
      await midenClient.createPrescriptionNote({
        patientId: patient.id,
        doctorId: selectedDoctor.id,
        pharmacistId: "0x962c393e4be8b7002d78783908a73e",
        medication: formState.medicationName,
        dosage: `${formState.dosage}${formState.dosageUnit}`,
        frequency: formState.frequency,
        duration: `${formState.duration}${formState.durationUnit}`,
        pharmacistNotes: formState.notes,
      });

      await midenClient.sendNoteToDoctor(
        "mock-note-id",
        selectedDoctor.id
      );

      // Update store
      const newPrescription = {
        id: `note-${Date.now()}`,
        patientId: patient.id,
        pharmacistId: "0x962c393e4be8b7002d78783908a73e",
        doctorId: selectedDoctor.id,
        testResultsHash: "0x" + "a".repeat(64),
        medication: formState.medicationName,
        dosage: `${formState.dosage}${formState.dosageUnit}`,
        frequency: formState.frequency,
        duration: `${formState.duration}${formState.durationUnit}`,
        pharmacistNotes: formState.notes,
        status: "in_transit" as const,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      addPrescription(newPrescription);
      updatePatientStatus(patientId || "", "Complete");

      setShowOverlay(false);

      // Show success screen
      navigate(`/pharmacist/success`, {
        state: {
          doctorName: selectedDoctor.name,
          noteId: newPrescription.id,
        },
      });
    } catch (error) {
      setShowOverlay(false);
      showToast("Failed to send prescription note. Please try again.", "error");
    }
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-status-high mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Patient Not Found</h2>
          <Button variant="primary" onClick={() => navigate("/pharmacist")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {showOverlay && <ZKProofOverlay />}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/pharmacist")}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-text-primary">
            Session with {patient.name}
          </h1>
          <p className="text-text-secondary mt-1">
            Create a new prescription note for this patient
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: Patient Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Card */}
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Patient Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-text-tertiary">Name</p>
                  <p className="text-text-primary font-medium">{patient.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-text-tertiary">Age</p>
                    <p className="text-text-primary font-medium">{patient.age} years</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-tertiary">Blood Type</p>
                    <p className="text-text-primary font-medium">{patient.bloodType}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-tertiary">Appointment</p>
                  <p className="text-text-primary font-medium">
                    {patient.appointmentTime.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Test Results */}
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Test Results</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {patient.testResults.map((result, idx) => {
                  const flagColor =
                    result.flag === "normal"
                      ? "bg-emerald-100 text-emerald-900"
                      : result.flag === "low"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-red-100 text-red-900";

                  return (
                    <div key={idx} className="pb-3 border-b border-border-default last:border-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-text-primary">{result.type}</p>
                        <Badge className={`text-xs ${flagColor}`}>{result.flag}</Badge>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {result.value} {result.unit}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        Range: {result.referenceRange}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-3">
            <Card>
              {isSessionComplete && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Session Complete</p>
                    <p className="text-sm text-green-800">Prescription has already been sent. View only.</p>
                  </div>
                </div>
              )}
              {/* Step Indicator */}
              <div className={`flex items-center justify-between mb-8 pb-8 border-b border-border-default ${isSessionComplete ? 'opacity-50 pointer-events-none' : ''}`}>
                {([1, 2, 3, 4] as const).map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                        step === currentStep
                          ? "bg-primary-800 text-white"
                          : step < currentStep
                            ? "bg-status-normal text-white"
                            : "bg-surface-sunken text-text-tertiary"
                      }`}
                    >
                      {step < currentStep ? "✓" : step}
                    </div>
                    {step < 4 && (
                      <div
                        className={`flex-1 h-1 mx-2 transition-colors ${
                          step < currentStep ? "bg-status-normal" : "bg-border-default"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Select Doctor */}
              {currentStep === 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Select Doctor</h3>

                  {/* Search Input */}
                  <div className="mb-4 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary" />
                    <input
                      type="text"
                      placeholder="Search by name or specialty..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800"
                    />
                  </div>

                  {/* Doctor List */}
                  <div className="space-y-2">
                    {filteredDoctors.map((doctor) => (
                      <button
                        key={doctor.id}
                        onClick={() => {
                          setFormState({ ...formState, doctorId: doctor.id });
                        }}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                          formState.doctorId === doctor.id
                            ? "border-primary-800 bg-primary-50"
                            : "border-border-default hover:border-primary-800"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-text-primary">{doctor.name}</p>
                            <p className="text-sm text-text-secondary">{doctor.specialty}</p>
                          </div>
                          <Badge className="bg-status-normal/20 text-status-normal text-xs">
                            Verified
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Medication Details */}
              {currentStep === 2 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Medication Details
                  </h3>

                  <div className="space-y-4">
                    {/* Medication Name */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Medication Name
                      </label>
                      <input
                        type="text"
                        value={formState.medicationName}
                        onChange={(e) =>
                          setFormState({ ...formState, medicationName: e.target.value })
                        }
                        placeholder="e.g., Aspirin"
                        className="w-full px-4 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800"
                      />
                    </div>

                    {/* Dosage */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-text-primary mb-1">
                          Dosage
                        </label>
                        <input
                          type="number"
                          value={formState.dosage}
                          onChange={(e) =>
                            setFormState({ ...formState, dosage: e.target.value })
                          }
                          placeholder="e.g., 500"
                          className="w-full px-4 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                          Unit
                        </label>
                        <select
                          value={formState.dosageUnit}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              dosageUnit: e.target.value as "mg" | "ml" | "units",
                            })
                          }
                          className="w-full px-4 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800"
                        >
                          <option value="mg">mg</option>
                          <option value="ml">ml</option>
                          <option value="units">units</option>
                        </select>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Frequency
                      </label>
                      <select
                        value={formState.frequency}
                        onChange={(e) =>
                          setFormState({ ...formState, frequency: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800"
                      >
                        <option value="daily">Daily</option>
                        <option value="twice-daily">Twice Daily</option>
                        <option value="three-times-daily">Three Times Daily</option>
                        <option value="as-needed">As Needed</option>
                      </select>
                    </div>

                    {/* Duration */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-text-primary mb-1">
                          Duration
                        </label>
                        <input
                          type="number"
                          value={formState.duration}
                          onChange={(e) =>
                            setFormState({ ...formState, duration: e.target.value })
                          }
                          placeholder="e.g., 7"
                          className="w-full px-4 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                          Unit
                        </label>
                        <select
                          value={formState.durationUnit}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              durationUnit: e.target.value as "days" | "weeks",
                            })
                          }
                          className="w-full px-4 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800"
                        >
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Notes */}
              {currentStep === 3 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Notes for Doctor
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Clinical Context
                    </label>
                    <textarea
                      value={formState.notes}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          setFormState({ ...formState, notes: e.target.value });
                        }
                      }}
                      placeholder="Provide any clinical context for the doctor..."
                      maxLength={500}
                      rows={6}
                      className="w-full px-4 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800 resize-none"
                    />
                    <p className="text-xs text-text-tertiary mt-2">
                      {formState.notes.length}/500 characters
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Send */}
              {currentStep === 4 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Review & Send
                  </h3>

                  <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="bg-surface-sunken p-4 rounded-lg space-y-3">
                      <div>
                        <p className="text-xs font-medium text-text-tertiary">Patient</p>
                        <p className="text-text-primary font-medium">{patient.name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-tertiary">Doctor</p>
                        <p className="text-text-primary font-medium">{selectedDoctor?.name}</p>
                        {selectedDoctor && (
                          <p className="text-xs text-text-secondary font-mono">
                            {selectedDoctor.id}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-tertiary">Medication</p>
                        <p className="text-text-primary font-medium">
                          {formState.medicationName} - {formState.dosage}
                          {formState.dosageUnit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-tertiary">Frequency & Duration</p>
                        <p className="text-text-primary font-medium">
                          {formState.frequency}, {formState.duration}
                          {formState.durationUnit}
                        </p>
                      </div>
                      {formState.notes && (
                        <div>
                          <p className="text-xs font-medium text-text-tertiary">Notes</p>
                          <p className="text-text-primary text-sm">{formState.notes}</p>
                        </div>
                      )}
                      <div className="pt-2 border-t border-border-default">
                        <p className="text-xs font-medium text-text-tertiary">Expires</p>
                        <p className="text-text-primary font-medium">
                          {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-3 mt-8 pt-8 border-t border-border-default">
                <Button
                  variant="secondary"
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1 || isSessionComplete}
                >
                  Back
                </Button>

                {currentStep === 4 ? (
                  <>
                    <Button variant="secondary" onClick={() => navigate("/pharmacist")} disabled={isSessionComplete}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSend} disabled={isSessionComplete}>
                      Send Prescription Note
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" onClick={handleNextStep} disabled={isSessionComplete}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
