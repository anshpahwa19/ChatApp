import styles from "./PhoneFrame.module.css";

/** Centres the 393px-wide mobile screen on large viewports; fills the screen on phones. */
type Props = {
  children: React.ReactNode;
  className?: string;
  /** Skip the screen's entrance animations (set when arriving from another screen). */
  instant?: boolean;
};

export function PhoneFrame({ children, className, instant }: Props) {
  return (
    <div className={styles.stage}>
      <div className={`${styles.device} ${className ?? ""}`} data-instant={instant || undefined}>{children}</div>
    </div>
  );
}
