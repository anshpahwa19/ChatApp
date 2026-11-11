import styles from "./PhoneFrame.module.css";

/** Centres the 393px-wide mobile screen on large viewports; fills the screen on phones. */
export function PhoneFrame({
  children,
  className,
  ref,
}: {
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className={styles.stage}>
      <div ref={ref} className={`${styles.device} ${className ?? ""}`}>
        {children}
      </div>
    </div>
  );
}
