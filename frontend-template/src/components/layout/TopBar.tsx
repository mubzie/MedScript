import { LogOut, Dot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@miden-sdk/miden-wallet-adapter";
import { useWalletStore } from "@/store/walletStore";
import { Button } from "@/components/shared/Button";

const ROLE_COLORS = {
  pharmacist: "bg-role-pharmacist",
  doctor: "bg-role-doctor",
  patient: "bg-role-patient",
};

const ROLE_LABELS = {
  pharmacist: "Pharmacist",
  doctor: "Doctor",
  patient: "Patient",
};

function truncateAccount(accountId: string): string {
  if (accountId.length <= 10) return accountId;
  const first = accountId.slice(0, 6);
  const last = accountId.slice(-4);
  return `${first}...${last}`;
}

export function TopBar() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { account, disconnect } = useWalletStore();

  if (!account) return null;

  const handleDisconnect = async () => {
    // Disconnect from wallet adapter if available
    if (wallet?.disconnect) {
      try {
        await wallet.disconnect();
      } catch (err) {
        console.error("Failed to disconnect wallet:", err);
      }
    }
    
    // Clear app store and redirect
    disconnect();
    navigate("/connect");
  };

  return (
    <div className="sticky top-0 z-40 bg-surface-base border-b border-border-default">
      <div className="flex flex-col gap-3 px-4 md:px-6 py-3 md:py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold text-text-primary">MedScript</div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4 md:justify-center">
          <code className="text-sm text-text-secondary font-mono">
            {truncateAccount(account.id)}
          </code>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-amber/20 text-status-amber border border-status-amber/30">
            Testnet
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4 md:ml-auto">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${ROLE_COLORS[account.type]}`}>
            {ROLE_LABELS[account.type]}
          </span>

          <div className="hidden md:flex items-center gap-1.5">
            <Dot
              className={`w-2 h-2 ${
                account.isVerified
                  ? "text-status-normal fill-status-normal"
                  : "text-status-high fill-status-high"
              }`}
            />
            <span className="text-xs text-text-secondary">
              {account.isVerified ? "Verified" : "Unverified"}
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDisconnect}
            className="gap-2 px-2.5 md:px-3"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Disconnect</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
