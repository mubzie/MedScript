import { useCallback } from "react";
import { useToastStore } from "@/store/toastStore";

export function useToast() {
  const { addToast } = useToastStore();

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      addToast({
        id: `${Date.now()}`,
        message,
        type,
      });
    },
    [addToast]
  );

  return { showToast };
}
