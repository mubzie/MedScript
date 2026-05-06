import { LogOut, Dot } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const { account, disconnect } = useWalletStore();

  if (!account) return null;

  const handleDisconnect = () => {
    disconnect();
    navigate("/connect");
  };

  return (
    <div className="sticky top-0 z-40 bg-surface-base border-b border-border-default">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Wordmark */}
        <div className="text-lg font-bold text-text-primary">MedScript</div>

        {/* Center: Account & Network */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <code className="text-sm text-text-secondary font-mono">
              {truncateAccount(account.id)}
            </code>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-amber/20 text-status-amber border border-status-amber/30">
            Testnet
          </span>
        </div>

        {/* Right: Role, Status, Disconnect */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${ROLE_COLORS[account.type]}`}>
              {ROLE_LABELS[account.type]}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
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
            className="gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect
          </Button>
        </div>
      </div>
    </div>
  );
}
