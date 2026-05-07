import { type ReactNode } from "react";
import { MidenProvider } from "@miden-sdk/react";
import { MidenFiSignerProvider, WalletModalProvider, WalletProvider } from "@miden-sdk/miden-wallet-adapter";
import "@miden-sdk/miden-wallet-adapter/styles.css";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { APP_NAME, MIDEN_RPC_URL, MIDEN_PROVER } from "@/config";

export function AppProviders({ children }: { children: ReactNode }) {
  // WalletMultiButton automatically detects installed wallet extensions
  // Pass empty array - the adapter discovers wallets from browser
  const wallets: any[] = [];

  return (
    <WalletProvider wallets={wallets}>
      <MidenFiSignerProvider appName={APP_NAME} autoConnect>
        <WalletModalProvider>
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
            <ToastProvider>
              {children}
            </ToastProvider>
          </MidenProvider>
        </WalletModalProvider>
      </MidenFiSignerProvider>
    </WalletProvider>
  );
}
