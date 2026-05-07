import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "@/providers";
import { ConnectPage } from "@/pages/connect";
import { PharmacistPage } from "@/pages/pharmacist";
import { PharmacistSessionPage } from "@/pages/pharmacist/session";
import { PharmacistSuccessPage } from "@/pages/pharmacist/success";
import { DoctorPage } from "@/pages/doctor";
import { PatientPage } from "@/pages/patient";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { TopBar } from "@/components/layout/TopBar";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <Routes>
            <Route path="/connect" element={<ConnectPage />} />
            <Route
              path="/pharmacist"
              element={
                <ProtectedRoute allowedRoles={["pharmacist"]}>
                  <AuthenticatedLayout>
                    <PharmacistPage />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacist/session/:patientId"
              element={
                <ProtectedRoute allowedRoles={["pharmacist"]}>
                  <AuthenticatedLayout>
                    <PharmacistSessionPage />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacist/success"
              element={
                <ProtectedRoute allowedRoles={["pharmacist"]}>
                  <AuthenticatedLayout>
                    <PharmacistSuccessPage />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacist/history"
              element={
                <ProtectedRoute allowedRoles={["pharmacist"]}>
                  <AuthenticatedLayout>
                    <PharmacistPage />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <AuthenticatedLayout>
                    <DoctorPage />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/prescription/:noteId"
              element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <AuthenticatedLayout>
                    <DoctorPage />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/history"
              element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <AuthenticatedLayout>
                    <DoctorPage />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <AuthenticatedLayout>
                    <PatientPage />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/connect" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  );
}
