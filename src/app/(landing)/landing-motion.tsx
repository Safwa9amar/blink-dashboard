"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useInView,
  type Variants,
} from "motion/react";

/* ── Shared defaults ── */
const VIEW_OPTS = { once: true, amount: 0.15 } as const;

/* ── FadeUp ──
   Fades in + translates up when scrolling into view.
   Works as a direct wrapper in server components. */
export function FadeUp({
  children,
  className,
  delay = 0,
  y = 32,
  duration = 0.55,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={prefersReduced ? undefined : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEW_OPTS}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── FadeIn ──
   Simple opacity fade, no transform. */
export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={prefersReduced ? undefined : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={VIEW_OPTS}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ── SlideIn ──
   Slides in from left or right on scroll. */
export function SlideIn({
  children,
  className,
  from = "left",
  delay = 0,
  distance = 60,
}: {
  children: ReactNode;
  className?: string;
  from?: "left" | "right";
  delay?: number;
  distance?: number;
}) {
  const prefersReduced = useReducedMotion();
  const x = from === "left" ? -distance : distance;
  return (
    <motion.div
      className={className}
      initial={prefersReduced ? undefined : { opacity: 0, x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={VIEW_OPTS}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── ScaleIn ──
   Scales up from slightly smaller. */
export function ScaleIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={prefersReduced ? undefined : { opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={VIEW_OPTS}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Stagger ──
   Container + Item pair for staggered children reveals. */
const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const staggerItemVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={prefersReduced ? undefined : { ...staggerContainer, show: { transition: { staggerChildren: staggerDelay } } }}
      initial={prefersReduced ? undefined : "hidden"}
      whileInView="show"
      viewport={VIEW_OPTS}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerItemVariant}>
      {children}
    </motion.div>
  );
}

/* ── CountUp ──
   Animates a number from 0 to the target value. */
export function CountUp({
  value,
  suffix = "",
  prefix = "",
  duration = 1.8,
  className,
  labelClassName,
  label,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  labelClassName?: string;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const prefersReduced = useReducedMotion();
  const [display, setDisplay] = useState(prefersReduced ? value : 0);

  useEffect(() => {
    if (!isInView || prefersReduced) {
      setDisplay(value);
      return;
    }
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isInView, value, duration, prefersReduced]);

  const formatted = display >= 1000
    ? `${(display / 1000).toFixed(display >= 10000 ? 0 : 1)}${value >= 1000000 ? "M" : "K"}`
    : `${display}`;

  return (
    <div ref={ref}>
      <div className={className}>
        {prefix}{value >= 1000000
          ? `${(display / 1000000).toFixed(1)}M`
          : formatted}{suffix}
      </div>
      {label && <div className={labelClassName}>{label}</div>}
    </div>
  );
}

/* ── HeroEntrance ──
   Orchestrated hero section with staggered children. */
const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export function HeroEntrance({ children, className }: { children: ReactNode; className?: string }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={prefersReduced ? undefined : heroContainer}
      initial={prefersReduced ? undefined : "hidden"}
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function HeroItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={heroItem}>
      {children}
    </motion.div>
  );
}

/* ── FloatingWrapper ──
   Gentle continuous float for the phone mock. Uses CSS animation
   to avoid re-renders and respects reduced motion. */
export function FloatingWrapper({ children, className }: { children: ReactNode; className?: string }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={prefersReduced ? undefined : { opacity: 0, x: 40 }}
      animate={
        prefersReduced
          ? { opacity: 1 }
          : { opacity: 1, x: 0, y: [0, -10, 0] }
      }
      transition={
        prefersReduced
          ? { duration: 0 }
          : {
              opacity: { duration: 0.7, delay: 0.3 },
              x: { duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
            }
      }
    >
      {children}
    </motion.div>
  );
}
