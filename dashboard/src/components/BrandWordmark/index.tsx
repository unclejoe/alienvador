import "@fontsource/orbitron/800.css";

import styles from "./BrandWordmark.module.less";

interface BrandWordmarkProps {
  /** Font size in px; letter-spacing and wrap behaviour are fixed by the stylesheet. */
  size?: number;
}

/** "Alienvador" wordmark in the Orbitron sci-fi face with an alien gradient. */
export default function BrandWordmark({ size = 15 }: BrandWordmarkProps) {
  return (
    <span className={styles.wordmark} style={{ fontSize: size }}>
      Alienvador
    </span>
  );
}
