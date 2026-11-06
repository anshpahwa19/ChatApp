import styles from "./ReadTicks.module.css";

const SRC = {
  seen: "/figma/check-seen.svg",
  delivered: "/figma/check-delivered.svg",
  received: "/figma/check-received.svg",
} as const;

/** Double check mark used for read receipts. */
export function ReadTicks({ variant }: { variant: keyof typeof SRC }) {
  const src = SRC[variant];
  return (
    <span className={styles.ticks} role="img" aria-label={variant === "received" ? "Delivered" : "Read"}>
      <img className={styles.first} src={src} width={10.3089} height={7.60515} alt="" />
      <img src={src} width={10.3089} height={7.60515} alt="" />
    </span>
  );
}
