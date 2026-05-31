"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useSpring } from "motion/react";

/**
 * A custom scroll container with a Motion-animated, Blink-pink scrollbar.
 * The native scrollbar is hidden; the thumb springs to position, fades in while
 * hovering / scrolling, grows on hover, and is draggable.
 */
export function MotionScrollbar({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({ height: 0, maxTop: 0, scrollable: false });
  const [active, setActive] = useState(false); // hovering the area or recently scrolled
  const [thumbHover, setThumbHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // spring-driven vertical position of the thumb
  const top = useSpring(0, { stiffness: 700, damping: 45, mass: 0.6 });

  const measure = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const scrollable = scrollHeight > clientHeight + 1;
    const height = scrollable ? Math.max((clientHeight / scrollHeight) * clientHeight, 36) : 0;
    const maxTop = clientHeight - height;
    const range = scrollHeight - clientHeight;
    setMetrics({ height, maxTop, scrollable });
    top.set(range > 0 ? (scrollTop / range) * maxTop : 0);
  }, [top]);

  const wake = useCallback(() => {
    setActive(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setActive(false), 1200);
  }, []);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    measure();
    const onScroll = () => {
      measure();
      wake();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [measure, wake]);

  // drag the thumb to scroll
  const onThumbPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = viewport.current;
      if (!el) return;
      e.preventDefault();
      setDragging(true);
      const startY = e.clientY;
      const startScroll = el.scrollTop;
      const range = el.scrollHeight - el.clientHeight;

      const onMove = (ev: PointerEvent) => {
        if (metrics.maxTop <= 0) return;
        const delta = ev.clientY - startY;
        el.scrollTop = startScroll + (delta / metrics.maxTop) * range;
      };
      const onUp = () => {
        setDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [metrics.maxTop]
  );

  const visible = metrics.scrollable && (active || thumbHover || dragging);
  const wide = thumbHover || dragging;

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={wake}
      onMouseMove={wake}
      onMouseLeave={() => setActive(false)}
    >
      <div ref={viewport} className="h-full w-full overflow-y-auto overflow-x-hidden no-native-scrollbar">
        {children}
      </div>

      {/* custom track + thumb */}
      <div className="pointer-events-none absolute top-0 bottom-0 end-0 w-3.5 z-50">
        <AnimatePresence>
          {visible && (
            <motion.div
              key="thumb"
              onPointerDown={onThumbPointerDown}
              onMouseEnter={() => setThumbHover(true)}
              onMouseLeave={() => setThumbHover(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: dragging ? 1 : 0.85 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ top, height: metrics.height }}
              className="pointer-events-auto absolute end-[3px] cursor-grab active:cursor-grabbing"
            >
              <motion.div
                animate={{ width: wide ? 8 : 6 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="mx-auto h-full rounded-full"
                style={{
                  background: wide
                    ? "linear-gradient(180deg, var(--primary), var(--primary-hover))"
                    : "color-mix(in srgb, var(--primary) 70%, transparent)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
