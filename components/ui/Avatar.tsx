import type { AvatarSpec } from "@/lib/data";
import styles from "./Avatar.module.css";

/** 52px circular chat avatar: photo, initials, or stylised icon. */
export function Avatar({ spec, name }: { spec: AvatarSpec; name: string }) {
  if (spec.kind === "image") {
    return (
      <span className={styles.avatar}>
        <img className={styles.photo} src={spec.src} width={51} height={51} alt={name} />
      </span>
    );
  }

  if (spec.kind === "initials") {
    return (
      <span className={styles.avatar} aria-label={name} role="img">
        <span className={styles.initials} style={{ background: spec.bg, color: spec.fg }}>
          {spec.initials}
        </span>
      </span>
    );
  }

  if (spec.variant === "group") {
    return (
      <span className={styles.avatar} aria-label={name} role="img">
        <img className={styles.stylisedAsset} src="/figma/avatar-stylised.svg" width={51} height={51} alt="" />
      </span>
    );
  }

  if (spec.variant === "community") {
    return (
      <span className={`${styles.avatar} ${styles.community}`} aria-label={name} role="img">
        <img className={styles.flip} src="/figma/user-icon-community.svg" width={28.3333} height={28.3333} alt="" />
      </span>
    );
  }

  return (
    <span className={styles.avatar} aria-label={name} role="img">
      <span className={styles.contact}>
        <img src="/figma/user-icon.svg" width={25.5} height={25.5} alt="" />
      </span>
    </span>
  );
}
