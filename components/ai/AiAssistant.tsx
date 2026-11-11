import { summaryRanges, type SummaryRange } from "@/lib/data";
import styles from "./AiAssistant.module.css";

const FEATURES = [
  {
    id: "smart-replies",
    title: "Generate smart replies",
    description: "Suggest responses based on context",
    icon: "/figma/ai-smart-replies.svg",
    tint: styles.tintPurple,
  },
  {
    id: "smart-tags",
    title: "Smart tag prioritization",
    description: "Categorize and rank urgent topics",
    icon: "/figma/ai-tag.svg",
    tint: styles.tintPink,
  },
  {
    id: "action-items",
    title: "Extract action items",
    description: "Automatically find tasks and deadlines",
    icon: "/figma/ai-action-items.svg",
    tint: styles.tintLime,
  },
] as const;

type Props = { onSummarize: (range: SummaryRange) => void };

/** "AI Chat Assistant" sheet content (Figma node 41:1965). */
export function AiAssistant({ onSummarize }: Props) {
  const [firstRow, secondRow] = [summaryRanges.slice(0, 3), summaryRanges.slice(3)];

  return (
    <div className={styles.root}>
      <div className={styles.title} style={{ "--i": 0 } as React.CSSProperties}>
        <img src="/figma/ai-title-icon.svg" width={24} height={24} alt="" />
        <h2>AI Chat Assistant</h2>
      </div>

      <div className={styles.list}>
        <div className={styles.summarize}>
          <button
            type="button"
            className={styles.feature}
            style={{ "--i": 1 } as React.CSSProperties}
            onClick={() => onSummarize("24h")}
          >
            <span className={`${styles.icon} ${styles.tintBlue}`}>
              <img src="/figma/ai-summarize.svg" width={24} height={24} alt="" />
            </span>
            <span className={styles.text}>
              <span className={styles.featureTitle}>Summarize chat</span>
              <span className={styles.featureDescription}>Get a quick recap of recent messages</span>
            </span>
          </button>

          <div className={styles.ranges} role="group" aria-label="Summarize messages from">
            {[firstRow, secondRow].map((row, r) => (
              <div key={r} className={styles.rangeRow}>
                {row.map((range, i) => (
                  <button
                    key={range.id}
                    type="button"
                    className={`${styles.range} ${range.id === "since-last" ? styles.rangeAuto : ""}`}
                    style={{ "--i": 2 + r * 3 + i } as React.CSSProperties}
                    onClick={() => onSummarize(range.id)}
                  >
                    <span>{range.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {FEATURES.map((f, i) => (
          <div key={f.id} className={styles.featureBlock}>
            <img className={styles.divider} src="/figma/ai-divider.svg" width={281} height={1} alt="" />
            <button type="button" className={styles.feature} style={{ "--i": 7 + i } as React.CSSProperties}>
              <span className={`${styles.icon} ${f.tint}`}>
                <img src={f.icon} width={24} height={24} alt="" />
              </span>
              <span className={styles.text}>
                <span className={styles.featureTitle}>{f.title}</span>
                <span className={styles.featureDescription}>{f.description}</span>
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
