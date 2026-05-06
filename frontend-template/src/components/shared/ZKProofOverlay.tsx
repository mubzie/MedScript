import { ShieldCheck } from "lucide-react";

interface ZKProofOverlayProps {
  visible: boolean;
}

export function ZKProofOverlay({ visible }: ZKProofOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 glass flex-center z-50">
      <div className="text-center max-w-sm px-6">
        {/* Icon with pulsing ring */}
        <div className="relative w-fit mx-auto mb-6">
          <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-20" />
          <ShieldCheck className="w-12 h-12 text-primary-800 relative z-10" />
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          Generating zero-knowledge proof
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-text-secondary mb-6">
          Your data stays private. Only the proof is submitted to Miden.
        </p>

        {/* Progress bar */}
        <div className="w-full h-0.5 bg-primary-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-800 animate-pulse" style={{ width: "65%" }} />
        </div>
      </div>
    </div>
  );
}
