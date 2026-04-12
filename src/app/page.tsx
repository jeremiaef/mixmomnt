import styles from './page.module.css';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className={styles.page}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>

          {/* Logo mark */}
          <div className={styles.logoMark} aria-label="mixmomnt logo">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Outer diamond */}
              <path
                d="M20 4L36 20L20 36L4 20Z"
                stroke="#3a7a5a"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Inner diamond */}
              <path
                d="M20 10L30 20L20 30L10 20Z"
                fill="#3a7a5a"
                fillOpacity="0.2"
              />
              {/* Center dot */}
              <circle cx="20" cy="20" r="3" fill="#3a7a5a" />
            </svg>
          </div>

          {/* Headline */}
          <h1 className={styles.headline}>where vibecoders ship</h1>

          {/* Subline */}
          <p className={styles.sub}>
            Every builder gets a portfolio at{' '}
            <code className={styles.codeInline}>
              username.mixmomnt.com
            </code>
            , built from what you&apos;ve shipped. No code required.
          </p>

          {/* CTAs */}
          <div className={styles.ctaGroup}>
            <Link href="/app" className={styles.ctaPrimary}>
              Get started — it&apos;s free
            </Link>
            <Link href="/explore" className={styles.ctaSecondary}>
              explore builders
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer note ──────────────────────────────────── */}
      <footer className={styles.footer}>
        <span className={styles.footerText}>
          Built for the builders ship in the dark.
        </span>
      </footer>
    </main>
  );
}