import { Navigate } from "react-router-dom";
import { useWalletStore } from "@/store/walletStore";
import type { MidenAccount } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: MidenAccount["type"][];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { connected, account } = useWalletStore();

  // Not connected → redirect to /connect
  if (!connected || !account) {
    return <Navigate to="/connect" replace />;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(account.type)) {
    // Redirect to their correct dashboard
    return <Navigate to={`/${account.type}`} replace />;
  }

  return <>{children}</>;
}
