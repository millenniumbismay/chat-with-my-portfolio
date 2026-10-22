"use client";

import { assistant } from "@/content/assistant";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

type Props = {
  sourceRef: RefObject<HTMLSpanElement | null>;
  headerRef: RefObject<HTMLElement | null>;
  onClick: () => void;
  children: ReactNode;
};

// Keep one orb on screen, moving it between the in-page prompt and the header.
export default function AIDock({ sourceRef, headerRef, onClick, children }: Props) {
  const slotRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    const source = sourceRef.current;
    const header = headerRef.current;
    const slot = slotRef.current;
    const button = buttonRef.current;
    if (!source || !header || !slot || !button) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let initialized = false;
    let isDocked = false;
    let animation: Animation | undefined;
    let animationStart = "";

    function update() {
      frame = 0;
      const start = source!.getBoundingClientRect();
      const destination = slot!.getBoundingClientRect();
      const headerBottom = header!.getBoundingClientRect().bottom;
      // Switch before the source is hidden by the sticky header's fade.
      const nextDocked = start.bottom <= headerBottom + 24;
      const target = nextDocked ? destination : start;
      const transform = `translate3d(${target.left}px, ${target.top}px, 0) scale(${target.width / 38})`;
      const changed = initialized && nextDocked !== isDocked;
      const previous = changed ? getComputedStyle(button!).transform : "";
      button!.style.transform = transform;

      if (changed) {
        animation?.cancel();
        if (!motion.matches && typeof button!.animate === "function") {
          animationStart = previous;
          animation = button!.animate([{ transform: previous }, { transform }], {
            duration: 380,
            easing: "cubic-bezier(.22, 1, .36, 1)",
          });
        }
      } else if (animation?.playState === "running") {
        // Keep the destination attached to the prompt during an upward scroll.
        (animation.effect as KeyframeEffect | null)?.setKeyframes([
          { transform: animationStart },
          { transform },
        ]);
      }
      if (!initialized) {
        initialized = true;
        source!.dataset.aiReady = "true";
        setReady(true);
      }
      if (nextDocked !== isDocked) {
        isDocked = nextDocked;
        setDocked(nextDocked);
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    function stopMotion() {
      if (motion.matches) animation?.cancel();
    }
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", stopMotion);
    const observer =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
    observer?.observe(header);
    // Content changes above the prompt can move the source without a scroll.
    if (source.parentElement?.parentElement?.parentElement)
      observer?.observe(source.parentElement.parentElement.parentElement);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", stopMotion);
      observer?.disconnect();
      cancelAnimationFrame(frame);
      animation?.cancel();
      delete source.dataset.aiReady;
    };
  }, [sourceRef, headerRef]);

  return (
    <span ref={slotRef} className="nav-ai-slot">
      <button
        ref={buttonRef}
        className={`migrating-ai${ready ? " is-ready" : ""}${docked ? " is-docked" : ""}`}
        type="button"
        onClick={onClick}
        aria-label={assistant.action}
        title={assistant.action}
        aria-hidden={!docked}
        tabIndex={docked ? 0 : -1}
      >
        {children}
      </button>
    </span>
  );
}
