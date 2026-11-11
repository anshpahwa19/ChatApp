import Link from "next/link";
import type { Conversation } from "@/lib/data";
import { StatusBar } from "@/components/ui/StatusBar";
import styles from "./ChatHeader.module.css";

/** Floating glass header: back button, contact pill and call buttons (Figma node 41:1686). */
export function ChatHeader({ conversation }: { conversation: Conversation }) {
  return (
    <header className={styles.header}>
      <StatusBar tone="dark" />
      <div className={styles.row}>
        <div className={styles.left}>
          <Link href="/" className={`${styles.glass} liquid-glass ${styles.back}`} aria-label="Back to chats">
            <img src="/figma/back.svg" width={16} height={16} alt="" />
          </Link>
          <div className={`${styles.glass} liquid-glass ${styles.pill}`}>
            <span className={styles.avatar}>
              <img src={conversation.avatar} alt="" />
              {conversation.status === "Online" && <span className={styles.online} aria-hidden />}
            </span>
            <div className={styles.text}>
              <h1 className={styles.name}>{conversation.name}</h1>
              <span className={styles.status}>{conversation.status}</span>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={`${styles.glass} liquid-glass ${styles.round}`} aria-label="Voice call">
            <img src="/figma/phone.svg" width={24} height={24} alt="" />
          </button>
          <button type="button" className={`${styles.glass} liquid-glass ${styles.round}`} aria-label="Video call">
            <img src="/figma/video-camera.svg" width={24} height={24} alt="" />
          </button>
        </div>
      </div>
    </header>
  );
}
