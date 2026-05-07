import { useEffect } from "react";
import { useWallet } from "@miden-sdk/miden-wallet-adapter";
import { useWalletStore } from "@/store/walletStore";

/**
 * Hook to sync Miden wallet connection state with app store.
 * Listens for wallet connect/disconnect and updates store.
 */
export function useWalletConnection() {
  const wallet = useWallet();
  const { setConnected, setAccount, disconnect } = useWalletStore();

  useEffect(() => {
    // Only sync if wallet adapter is available
    if (!wallet) return;

    // When wallet connects
    if (wallet.connected && wallet.address) {
      const accountId = wallet.address;
      
      setConnected(true);
      setAccount({
        id: accountId || "unknown",
        // Determine type from credential hash or default to patient
        type: getAccountType(accountId),
        credentialHash: "0x" + "a".repeat(64), // Placeholder until SDK provides it
        isVerified: true,
        network: "testnet",
      });
    } else if (!wallet.connected) {
      // When wallet disconnects
      disconnect();
    }
  }, [wallet?.connected, wallet?.address, setConnected, setAccount, disconnect]);

  return wallet;
}

// Simple heuristic to determine role from account ID
// In real implementation, query account metadata from chain
function getAccountType(accountId: string): "pharmacist" | "doctor" | "patient" {
  if (!accountId) return "patient";
  
  // For demo: hash the account ID and map to role
  const hash = accountId.charCodeAt(0) + accountId.charCodeAt(accountId.length - 1);
  const roles: ("pharmacist" | "doctor" | "patient")[] = ["pharmacist", "doctor", "patient"];
  return roles[hash % 3];
}
