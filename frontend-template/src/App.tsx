import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "@/providers";
import { ConnectPage } from "@/pages/connect";
import { PharmacistPage } from "@/pages/pharmacist";
import { DoctorPage } from "@/pages/doctor";
import { PatientPage } from "@/pages/patient";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <Routes>
            <Route path="/connect" element={<ConnectPage />} />
            <Route path="/pharmacist" element={<PharmacistPage />} />
            <Route path="/pharmacist/session/:patientId" element={<PharmacistPage />} />
            <Route path="/pharmacist/history" element={<PharmacistPage />} />
            <Route path="/doctor" element={<DoctorPage />} />
            <Route path="/doctor/prescription/:noteId" element={<DoctorPage />} />
            <Route path="/doctor/history" element={<DoctorPage />} />
            <Route path="/patient" element={<PatientPage />} />
            <Route path="/" element={<Navigate to="/connect" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  );
}
