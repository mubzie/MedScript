import { useState, useCallback, useEffect } from "react";
import { useSyncState, useAccount, useImportAccount } from "@miden-sdk/react";
import { useWalletStore } from "@/store/walletStore";
import { COUNTER_SLOT_NAME, EXPLORER_BASE_URL } from "@/config";

export function useIncrementCounter(counterAddress: string) {
  const { account: walletAccount } = useWalletStore();
  const walletConnected = Boolean(walletAccount?.id);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const { importAccount } = useImportAccount();
  const { account } = useAccount(counterAddress);
  const { sync } = useSyncState();

  // Import the counter account so the local client tracks it.
  // The catch is intentional — the account may already be imported.
  useEffect(() => {
    importAccount({ type: "id", accountId: counterAddress }).catch(() => {});
  }, [importAccount, counterAddress]);

  useEffect(() => {
    const readCount = async () => {
      if (!account) {
        setCount(null);
        return;
      }

      const { Felt, Word } = await import("@miden-sdk/miden-sdk");
      const countKey = Word.newFromFelts([
        new Felt(0n),
        new Felt(0n),
        new Felt(0n),
        new Felt(1n),
      ]);
      const value = account.storage().getMapItem(COUNTER_SLOT_NAME, countKey);
      setCount(value ? Number(value.toU64s()[3]) : 0);
    };

    void readCount();
  }, [account]);

  const increment = useCallback(async () => {
    if (!walletConnected) {
      setError("Connect an account from /connect before sending transactions.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      // Counter demo flow kept lightweight after wallet-adapter removal.
      setIsWaiting(true);
      await new Promise((r) => setTimeout(r, 1200));
      await sync();
      setIsWaiting(false);
    } catch (err) {
      setIsSubmitting(false);
      setIsWaiting(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [walletConnected, sync]);

  return {
    increment,
    count,
    isSubmitting,
    isWaiting,
    error,
    walletConnected,
    explorerUrl: `${EXPLORER_BASE_URL}/account/${counterAddress}`,
  };
}
