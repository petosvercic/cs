type BadgeTone = "neutral" | "success" | "warning";

type BadgeProps = {
  tone?: BadgeTone;
  children: string;
};

const toneClass: Record<BadgeTone, string> = {
  neutral: "badge",
  success: "badge badge-success",
  warning: "badge badge-warning"
};

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={toneClass[tone]}>{children}</span>;
}
