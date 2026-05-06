import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Badge";
import { Badge } from "@/components/shared/Badge";
import { Wallet, CheckCircle } from "lucide-react";
import { useWalletStore } from "@/store/walletStore";

export function ConnectPage() {
  const navigate = useNavigate();
  const { setConnected, setAccount, setConnecting } = useWalletStore();
  const [selectedRole, setSelectedRole] = useState<"pharmacist" | "doctor" | null>(null);

  const handleConnect = async (role: "pharmacist" | "doctor") => {
    setSelectedRole(role);
    setConnecting(true);

    // Simulate wallet connection delay
    await new Promise((r) => setTimeout(r, 1500));

    // Set mock account
    setAccount({
      id: role === "pharmacist" ? "0x962c393e4be8b7002d78783908a73e" : "0xce9a185139464d0077efb96d6dfaa3",
      type: role,
      credentialHash: "0x" + "a".repeat(64),
      isVerified: true,
      network: "testnet",
    });

    setConnected(true);
    setConnecting(false);

    // Navigate to appropriate dashboard
    navigate(`/${role}`);
  };

  return (
    <div className="min-h-screen bg-surface-base flex-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-3">MedScript</h1>
          <p className="text-lg text-text-secondary">
            Privacy-preserving prescription management on Miden
          </p>
        </div>

        <div className="grid gap-6">
          {/* Pharmacist Card */}
          <Card
            onClick={() => !selectedRole && handleConnect("pharmacist")}
            className={`cursor-pointer transition-all ${
              selectedRole === "pharmacist" ? "ring-2 ring-primary-600" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-1">Pharmacist</h2>
                <p className="text-sm text-text-secondary">Manage prescriptions and fulfillment</p>
              </div>
              <Badge variant="role" type="pharmacist">
                Pharmacy
              </Badge>
            </div>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 text-primary-600" />
                Create and manage prescriptions
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 text-primary-600" />
                Receive approvals from doctors
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 text-primary-600" />
                Track fulfillment status
              </li>
            </ul>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleConnect("pharmacist");
              }}
              isLoading={selectedRole === "pharmacist"}
              className="w-full gap-2"
            >
              <Wallet className="w-4 h-4" />
              Connect Pharmacist Wallet
            </Button>
          </Card>

          {/* Doctor Card */}
          <Card
            onClick={() => !selectedRole && handleConnect("doctor")}
            className={`cursor-pointer transition-all ${
              selectedRole === "doctor" ? "ring-2 ring-primary-600" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-1">Doctor</h2>
                <p className="text-sm text-text-secondary">Approve and authorize prescriptions</p>
              </div>
              <Badge variant="role" type="doctor">
                Medical
              </Badge>
            </div>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 text-primary-600" />
                Review patient test results
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 text-primary-600" />
                Approve or modify prescriptions
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 text-primary-600" />
                Maintain complete records
              </li>
            </ul>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleConnect("doctor");
              }}
              isLoading={selectedRole === "doctor"}
              className="w-full gap-2"
            >
              <Wallet className="w-4 h-4" />
              Connect Doctor Wallet
            </Button>
          </Card>
        </div>

        <p className="text-center text-xs text-text-tertiary mt-8">
          Your credentials are secured with zero-knowledge proofs. Only consensus data is shared on-chain.
        </p>
      </div>
    </div>
  );
}
