import styles from "./Badge.module.css";

// A simple tinted badge: a light wash of the tone, a thin border of it, and the
// text in a lighter shade. Tones come from the Empire Drop palette.

export const TONES = {
  neutral: "#97979d",
  blue: "#3d7bff",
  cyan: "#2fd9e0",
  green: "#35d07f",
  lime: "#a8e03a",
  gold: "#ffce2f",
  orange: "#ff8a3d",
  red: "#ef4b56",
  pink: "#ff5ca8",
} as const;

export function Badge({ children, tone = TONES.neutral }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={styles.badge} style={{ "--tone": tone } as React.CSSProperties}>
      {children}
    </span>
  );
}
