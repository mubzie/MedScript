import type { ReactNode } from "react";

type StatusType = "normal" | "low" | "high" | "amber" | "neutral";
type RoleType = "pharmacist" | "doctor" | "patient";

interface BadgeProps {
  children: ReactNode;
  variant?: "status" | "role";
  type?: StatusType | RoleType;
}

const statusColors: Record<StatusType, string> = {
  normal: "bg-status-normal/10 text-status-normal",
  low: "bg-status-low/10 text-status-low",
  high: "bg-status-high/10 text-status-high",
  amber: "bg-status-amber/10 text-status-amber",
  neutral: "bg-status-neutral/10 text-status-neutral",
};

const roleColors: Record<RoleType, string> = {
  pharmacist: "bg-role-pharmacist/10 text-role-pharmacist",
  doctor: "bg-role-doctor/10 text-role-doctor",
  patient: "bg-role-patient/10 text-role-patient",
};

export function Badge({ children, variant = "status", type = "normal" }: BadgeProps) {
  const colors = variant === "status" ? statusColors[type as StatusType] : roleColors[type as RoleType];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${colors}`}>
      {children}
    </span>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      className={`
        bg-surface-base border border-border-default rounded-xl p-6
        shadow-sm hover:shadow-md transition-shadow
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && <div className="mb-4 text-primary-600">{icon}</div>}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-text-secondary mb-4">{subtitle}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
