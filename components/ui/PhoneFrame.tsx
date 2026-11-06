import styles from "./PhoneFrame.module.css";

/** Centres the 393px-wide mobile screen on large viewports; fills the screen on phones. */
export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={styles.stage}>
      <div className={`${styles.device} ${className ?? ""}`}>{children}</div>
    </div>
  );
}
