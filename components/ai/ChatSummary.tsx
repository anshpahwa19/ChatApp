import { chatSummary, summaryRanges, type SummaryRange } from "@/lib/data";
import styles from "./ChatSummary.module.css";

/** "Chat Summary" sheet content (Figma node 41:2070). */
export function ChatSummary({ range }: { range: SummaryRange }) {
  const description = summaryRanges.find((r) => r.id === range)?.description ?? "";
  let i = 0;
  const step = () => ({ "--i": i++ }) as React.CSSProperties;

  return (
    <div className={styles.root}>
      <div className={styles.header} style={step()}>
        <div className={styles.titleRow}>
          <img src="/figma/summary-title-icon.svg" width={24} height={24} alt="" />
          <h2>Chat Summary</h2>
        </div>
        <p className={styles.subtitle}>{description}</p>
      </div>

      <div className={styles.cards}>
        <section className={styles.missed} style={step()}>
          <div className={styles.cardHeading}>
            <img src="/figma/summary-chat.svg" width={24} height={24} alt="" />
            <h3>What did I miss?</h3>
          </div>
          <p className={styles.missedText}>{chatSummary.missed}</p>
        </section>

        <section className={styles.section} style={step()}>
          <div className={`${styles.cardHeading} ${styles.wide}`}>
            <img src="/figma/summary-decision.svg" width={24} height={24} alt="" />
            <h3>Decision</h3>
          </div>
          <BulletList items={chatSummary.decisions} />
          <img className={styles.divider} src="/figma/summary-divider.svg" width={345} height={1} alt="" />
        </section>

        <section className={styles.section} style={step()}>
          <div className={`${styles.cardHeading} ${styles.wide}`}>
            <img src="/figma/summary-actions.svg" width={24} height={24} alt="" />
            <h3>Actions</h3>
          </div>
          <BulletList items={chatSummary.actions} />
          <img className={styles.divider} src="/figma/summary-divider.svg" width={345} height={1} alt="" />
        </section>

        <section className={`${styles.section} ${styles.deadline}`} style={step()}>
          <div className={styles.deadlineHeading}>
            <div className={`${styles.cardHeading} ${styles.wide}`}>
              <img src="/figma/summary-deadline.svg" width={24} height={24} alt="" />
              <h3>Deadline</h3>
            </div>
            {chatSummary.deadlines.some((d) => d.dueToday) && (
              <span className={styles.due}>
                <img src="/figma/summary-due-clock.svg" width={10} height={10} alt="" />
                Due today
              </span>
            )}
          </div>
          <BulletList items={chatSummary.deadlines.map((d) => d.text)} />
        </section>
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className={styles.bullets}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
