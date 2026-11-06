import Link from "next/link";
import type { ChatPreview } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { ReadTicks } from "@/components/ui/ReadTicks";
import styles from "./ChatRow.module.css";

const PREVIEW_ICON = {
  deleted: "/figma/msg-deleted.svg",
  "missed-call": "/figma/msg-missed-call.svg",
  voice: "/figma/msg-voice.svg",
} as const;

export function ChatRow({ chat }: { chat: ChatPreview }) {
  const unread = chat.unread ?? 0;

  return (
    <Link href={`/chat/${chat.id}`} className={styles.row}>
      <Avatar spec={chat.avatar} name={chat.name} />
      <div className={styles.body}>
        <div className={styles.top}>
          <span className={styles.name}>{chat.name}</span>
          {chat.communityCount ? (
            <span className={`${styles.badge} ${styles.communityBadge}`}>
              {chat.communityCount}
              <img src="/figma/caret-right-small.svg" width={12} height={12} alt="" />
            </span>
          ) : chat.time ? (
            <span className={unread > 0 ? styles.timeUnread : styles.time}>{chat.time}</span>
          ) : unread > 0 ? (
            <UnreadBadge count={unread} />
          ) : null}
        </div>

        <div className={styles.bottom}>
          {chat.ticks && <ReadTicks variant={chat.ticks} />}
          {chat.previewIcon && (
            <img src={PREVIEW_ICON[chat.previewIcon]} width={16} height={16} alt="" className={styles.previewIcon} />
          )}
          <span className={`${styles.message} ${chat.danger ? styles.danger : ""}`}>
            {chat.author && (
              <>
                <span className={styles.author}>{chat.author}</span>
                <span className={styles.colon}>:</span>{" "}
              </>
            )}
            {chat.subGroup && (
              <>
                <span className={styles.subGroup}>{chat.subGroup}</span>
                <img className={styles.subGroupCaret} src="/figma/caret-right.svg" width={16} height={16} alt="" />
              </>
            )}
            {chat.message}
          </span>
          {chat.time && unread > 0 && <UnreadBadge count={unread} />}
        </div>
      </div>
    </Link>
  );
}

function UnreadBadge({ count }: { count: number }) {
  return (
    <span className={`${styles.badge} ${count > 9 ? styles.wide : ""}`} aria-label={`${count} unread`}>
      {count}
    </span>
  );
}
