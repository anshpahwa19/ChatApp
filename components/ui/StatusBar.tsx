import styles from "./StatusBar.module.css";

type Props = { tone?: "dark" | "white"; className?: string };

/** iOS-style status bar shown at the top of every screen in the designs. */
export function StatusBar({ tone = "dark", className }: Props) {
  return (
    <div className={`${styles.bar} ${tone === "white" ? styles.white : ""} ${className ?? ""}`} aria-hidden>
      <span className={styles.time}>09:47</span>
      <img
        className={styles.right}
        src={tone === "white" ? "/figma/status-right-white.svg" : "/figma/status-right-dark.svg"}
        width={78.6713}
        height={13}
        alt=""
      />
    </div>
  );
}
