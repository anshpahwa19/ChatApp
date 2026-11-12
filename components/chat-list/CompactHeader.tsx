import { glassPress } from "@/lib/useGlassPress";
import styles from "./CompactHeader.module.css";

/**
 * Inline navigation bar shown once the chat list is scrolled (Figma "Main chat list",
 * node 41:2338). It sits on a hard scroll-edge effect: an opaque frost that ends crisply
 * where the content starts. The title and controls spring in as the large title leaves.
 */
export function CompactHeader({ visible }: { visible: boolean }) {
  return (
    <div className={`${styles.header} ${visible ? styles.visible : ""}`} aria-hidden={!visible}>
      <div className={styles.edge} />
      <div className={styles.row}>
        <div className={styles.lead}>
          {/* 40px tinted circle with three story avatars (node 41:2482). */}
          <span className={styles.cluster} aria-label="Recent stories" role="img">
            <span className={`${styles.mini} ${styles.a}`}>
              <img src="/figma/story-yoga.jpg" alt="" />
            </span>
            <span className={`${styles.mini} ${styles.b}`}>
              <img src="/figma/story-yoga.jpg" alt="" />
            </span>
            <span className={`${styles.mini} ${styles.c}`}>
              <img src="/figma/story-yoga.jpg" alt="" />
            </span>
          </span>
          <span className={styles.title}>Chats</span>
        </div>
        <button
          type="button"
          className={`${styles.add} glass-press`}
          aria-label="New chat"
          tabIndex={visible ? 0 : -1}
          {...glassPress}
        >
          <img src="/figma/plus-white.svg" width={16} height={16} alt="" />
        </button>
      </div>
    </div>
  );
}
