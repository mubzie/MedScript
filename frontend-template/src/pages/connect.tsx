import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWalletStore } from "@/store/walletStore";
import { motion } from "framer-motion";
import { Button } from "@/components/shared/Button";
import { TESTNET_TRANSACTIONS } from "@/lib/mock/testnetAccounts";
import { connectWallet } from "@/lib/miden/midenClient";

type LoadingStage = "idle" | "initializing" | "creating";

export function ConnectPage() {
  const navigate = useNavigate();
  const {
    connected,
    account,
    connecting,
    error,
    setConnected,
    setAccount,
    setConnecting,
    setError,
  } = useWalletStore();
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [retryRole, setRetryRole] = useState<"pharmacist" | "doctor" | "patient" | null>(null);

  // If already connected, redirect to dashboard
  useEffect(() => {
    if (connected && account) {
      navigate(`/${account.type}`, { replace: true });
    }
  }, [connected, account, navigate]);

  const handleConnect = async (role: "pharmacist" | "doctor" | "patient") => {
    setRetryRole(role);
    setError(null);
    setConnecting(true);
    setLoadingStage("initializing");

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 100));
      setLoadingStage("creating");
      const accountData = await connectWallet(role);
      setAccount(accountData);
      setConnected(true);
      navigate(`/${role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(false);
      setLoadingStage("idle");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-surface-base flex-center p-6"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-2">MedScript</h1>
          <p className="text-sm text-text-secondary">
            Private medical prescriptions on Miden
          </p>
        </div>

        {/* Role-based connection */}
        <div className="card mb-8">
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => void handleConnect("pharmacist")}
              isLoading={connecting}
              disabled={connecting}
            >
              Connect as Pharmacist
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => void handleConnect("doctor")}
              isLoading={connecting}
              disabled={connecting}
            >
              Connect as Doctor
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => void handleConnect("patient")}
              isLoading={connecting}
              disabled={connecting}
            >
              Connect as Patient
            </Button>
            {connecting && (
              <div
                className="rounded-lg border border-border-default bg-surface-sunken p-3 text-sm text-text-secondary text-center"
                aria-live="polite"
              >
                {loadingStage === "initializing" && "Initializing Miden client..."}
                {loadingStage === "creating" && "Creating your account on testnet..."}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-status-high/30 bg-status-high/10 p-3 text-sm">
                <p className="text-status-high mb-2">{error}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => retryRole && void handleConnect(retryRole)}
                  disabled={!retryRole || connecting}
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Live on Testnet Panel */}
        <div className="card mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
              <span className="text-sm font-medium">Deployed on Miden Testnet</span>
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer">View transactions</summary>
              <ul className="mt-2 list-disc list-inside text-xs">
                {TESTNET_TRANSACTIONS.map((tx) => (
                  <li key={tx.hash}>
                    <a href={tx.explorerUrl} target="_blank" rel="noreferrer" className="text-primary-500 underline">
                      {tx.label}: {tx.hash}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>

        {/* Dev Mode Shortcuts (only in development) */}
        {import.meta.env.DEV && (
          <div className="space-y-2 pt-4 border-t border-border-default">
            <p className="text-xs text-text-tertiary text-center mb-3">
              Dev Mode — Quick login (bypasses wallet)
            </p>
            <Button variant="secondary" size="sm" onClick={() => void handleConnect("pharmacist")} className="w-full">
              Login as Pharmacist
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void handleConnect("doctor")} className="w-full">
              Login as Doctor
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void handleConnect("patient")} className="w-full">
              Login as Patient
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-text-tertiary mt-8">
          Your credentials are secured with zero-knowledge proofs.
        </p>
      </div>
    </motion.div>
  );
}
