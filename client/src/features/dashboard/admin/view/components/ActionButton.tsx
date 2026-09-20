import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type ActionButtonVariant = "primary" | "success" | "secondary" | "danger";

type ActionButtonProps = {
  icon: LucideIcon;
  label: string;
  tooltip: string;
  variant?: ActionButtonVariant;
  onClick: () => void;
};

const ACCENTS: Record<ActionButtonVariant, string> = {
  primary: "var(--bs-primary, #0d6efd)",
  success: "var(--bs-success, #198754)",
  secondary: "var(--bs-secondary, #6c757d)",
  danger: "var(--bs-danger, #dc3545)",
};

// Border stays invisible until hover, then takes the button's accent colour
const ACTION_BUTTON_CSS = `
.action-btn {
  width: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px;
  background: #fff;
  color: #495057;
  border: 2px solid transparent;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  cursor: pointer;
}
.action-btn:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}
.action-btn:active {
  transform: scale(0.97);
}
.action-btn:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
}
.action-btn .action-btn-icon {
  color: var(--accent);
}
.action-btn .action-btn-label {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
}
`;

// Inject the styles once, no matter how many buttons are rendered
const STYLE_ID = "action-btn-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = ACTION_BUTTON_CSS;
  document.head.appendChild(el);
}

// Square button: large bold icon centered, title underneath, tooltip on hover
export function ActionButton({ icon: Icon, label, tooltip, variant = "primary", onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      className="action-btn"
      style={{ "--accent": ACCENTS[variant] } as CSSProperties}
      title={tooltip}
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="action-btn-icon" size={34} strokeWidth={2.5} />
      <span className="action-btn-label">{label}</span>
    </button>
  );
}

// One straight row of square buttons; scrolls sideways on narrow screens
export function ActionButtonRow({ children }: { children: ReactNode }) {
  return (
    <div
      className="mb-4"
      style={{
        display: "grid",
        gridAutoFlow: "column",
        gridAutoColumns: "104px",
        gap: "16px",
        overflowX: "auto",
        padding: "6px 6px 12px",
      }}
    >
      {children}
    </div>
  );
}

export default ActionButton;