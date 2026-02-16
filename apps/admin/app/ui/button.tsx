import { ButtonHTMLAttributes, CSSProperties } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "#2563eb",
    color: "#ffffff",
    border: "1px solid #1d4ed8"
  },
  secondary: {
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db"
  },
  danger: {
    background: "#b91c1c",
    color: "#ffffff",
    border: "1px solid #991b1b"
  }
};

export function Button({ children, variant = "secondary", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        ...variantStyles[variant],
        borderRadius: 8,
        padding: "8px 12px",
        fontWeight: 600,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1
      }}
    >
      {children}
    </button>
  );
}
