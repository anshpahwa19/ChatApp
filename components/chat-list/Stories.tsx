import type { Story } from "@/lib/data";
import styles from "./Stories.module.css";

export function Stories({ stories }: { stories: Story[] }) {
  return (
    <ul className={styles.row} aria-label="Stories">
      {stories.map((story, i) => (
        <li key={story.id} className={styles.item} style={{ "--i": i } as React.CSSProperties}>
          <button type="button" className={styles.button} aria-label={story.isOwn ? "Add story" : `${story.name}'s story`}>
            {story.isOwn ? (
              <span className={styles.own}>
                <img className={styles.ownImage} src={story.image} width={56} height={56} alt="" />
                <span className={styles.addBadge}>
                  <img src="/figma/plus-small-dark.svg" width={13.7143} height={13.7143} alt="" />
                </span>
              </span>
            ) : (
              <span className={`${styles.ring} ${story.unseen ? styles.unseen : ""}`}>
                <span className={styles.avatar}>
                  <img src={story.image} alt="" />
                </span>
                {story.unseen && (
                  <UnseenRing />
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

/**
 * Segmented "new story" ring, drawn as an exact circle on the photo's centre so it stays
 * concentric while it turns. Matches the Figma ring: white, ~2.15px stroke, radius 26.9,
 * four segments with rounded ends.
 */
function UnseenRing() {
  return (
    <svg className={styles.unseenRing} width={56} height={56} viewBox="0 0 56 56" aria-hidden>
      <circle
        cx={28}
        cy={28}
        r={26.9}
        fill="none"
        stroke="#fff"
        strokeWidth={2.15}
        strokeLinecap="round"
        pathLength={100}
        // 4 segments of 21.9 with 3.1 gaps (3px visible gap once the round caps are added).
        strokeDasharray="21.9 3.1"
        strokeDashoffset={-1.55}
      />
    </svg>
  );
}
