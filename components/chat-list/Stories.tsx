import type { Story } from "@/lib/data";
import styles from "./Stories.module.css";

export function Stories({ stories }: { stories: Story[] }) {
  return (
    <ul className={styles.row} aria-label="Stories">
      {stories.map((story) => (
        <li key={story.id} className={styles.item}>
          <button type="button" className={styles.button} aria-label={story.isOwn ? "Add story" : `${story.name}'s story`}>
            {story.isOwn ? (
              <span className={styles.own}>
                <img className={styles.ownImage} src={story.image} width={56} height={56} alt="" />
                <span className={styles.addBadge}>
                  <img src="/figma/plus-small-white.svg" width={13.7143} height={13.7143} alt="" />
                </span>
              </span>
            ) : (
              <span className={`${styles.ring} ${story.unseen ? styles.unseen : ""}`}>
                <span className={styles.avatar}>
                  <img src={story.image} alt="" />
                </span>
                {story.unseen && (
                  <img className={styles.unseenRing} src="/figma/story-ring.svg" width={57} height={57} alt="" />
                )}
              </span>
            )}
            <span className={styles.label}>{story.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
