import { type ReactNode } from "react";
import { MidenProvider } from "@miden-sdk/react";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { MIDEN_RPC_URL, MIDEN_PROVER } from "@/config";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MidenProvider
      config={{ rpcUrl: MIDEN_RPC_URL, prover: MIDEN_PROVER }}
      loadingComponent={
        <div className="min-h-screen flex items-center justify-center bg-surface-base">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Loading MedScript</h2>
            <p className="text-sm text-text-secondary">Initializing Miden SDK...</p>
          </div>
        </div>
      }
    >
      <ToastProvider>{children}</ToastProvider>
    </MidenProvider>
  );
}
