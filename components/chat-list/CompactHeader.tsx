import { StatusBar } from "@/components/ui/StatusBar";
import styles from "./CompactHeader.module.css";

/** Collapsed header shown once the chat list is scrolled (Figma "Main chat list_scroll"). */
export function CompactHeader({ visible }: { visible: boolean }) {
  return (
    <div className={`${styles.header} ${visible ? styles.visible : ""}`} aria-hidden={!visible}>
      <StatusBar tone="dark" />
      <div className={styles.row}>
        <div className={styles.stack} aria-label="Recent stories">
          <span className={`${styles.stackItem} ${styles.first}`}>
            <span className={styles.stackImage}>
              <img src="/figma/stack-base.jpg" alt="" />
            </span>
          </span>
          <span className={styles.stackItem} style={{ background: "#cbedd8" }}>
            <span className={styles.stackImage}>
              <img src="/figma/stack-base.jpg" alt="" />
              <img src="/figma/stack-2.jpg" alt="" />
            </span>
          </span>
          <span className={styles.stackItem} style={{ background: "#d1efdd" }}>
            <span className={styles.stackImage}>
              <img src="/figma/stack-base.jpg" alt="" />
              <img src="/figma/stack-3.jpg" alt="" />
            </span>
          </span>
        </div>
        <span className={styles.title}>Chats</span>
        <button type="button" className={styles.add} aria-label="New chat" tabIndex={visible ? 0 : -1}>
          <img src="/figma/plus-white.svg" width={16} height={16} alt="" />
        </button>
      </div>
    </div>
  );
}
