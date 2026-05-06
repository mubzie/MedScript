import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWalletStore } from "@/store/walletStore";
import { WalletMultiButton } from "@miden-sdk/miden-wallet-adapter";
import { motion } from "framer-motion";
import { Button } from "@/components/shared/Button";

export function ConnectPage() {
  const navigate = useNavigate();
  const { connected, account, setConnected, setAccount } = useWalletStore();

  // If already connected, redirect to dashboard
  useEffect(() => {
    if (connected && account) {
      navigate(`/${account.type}`, { replace: true });
    }
  }, [connected, account, navigate]);

  const handleDevLogin = (role: "pharmacist" | "doctor" | "patient") => {
    setAccount({
      id:
        role === "pharmacist"
          ? "0x962c393e4be8b7002d78783908a73e"
          : role === "doctor"
            ? "0xce9a185139464d0077efb96d6dfaa3"
            : "0x3a1b2c5d8e9f4a6b7c8d9e0f1a2b3c4d",
      type: role,
      credentialHash: "0x" + "a".repeat(64),
      isVerified: true,
      network: "testnet",
    });
    setConnected(true);
    navigate(`/${role}`);
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

        {/* Main Wallet Connect Button */}
        <div className="card mb-8">
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>

        {/* Dev Mode Shortcuts (only in development) */}
        {import.meta.env.DEV && (
          <div className="space-y-2 pt-4 border-t border-border-default">
            <p className="text-xs text-text-tertiary text-center mb-3">
              Dev Mode — Quick login
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleDevLogin("pharmacist")}
              className="w-full"
            >
              Login as Pharmacist
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleDevLogin("doctor")}
              className="w-full"
            >
              Login as Doctor
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleDevLogin("patient")}
              className="w-full"
            >
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
