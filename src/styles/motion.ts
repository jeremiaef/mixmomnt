import type { Variants } from 'framer-motion';

/* ─── fadeUp ─────────────────────────────────────────────── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── staggerContainer ──────────────────────────────────── */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/* ─── cardHover ──────────────────────────────────────────── */
export const cardHover: Variants = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)' },
  hover: {
    y: -4,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

/* ─── panelSlideIn ───────────────────────────────────────── */
export const panelSlideIn: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── messageIn ─────────────────────────────────────────── */
export const messageIn: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  },
};