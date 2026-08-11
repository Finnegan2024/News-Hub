import { useEffect, useRef } from "react";
import type { ReadTrigger } from "../lib/feed";
import { useMarkArticleRead } from "./useFeed";

const SCROLL_THRESHOLD_PX = 50;
const DWELL_MS = 45_000;

// Marks an article read on whichever fires first: a >50px scroll on the
// detail page, or 45s of continuous (tab-visible) dwell time. See SPEC.md §6.
export function useReadTracking(articleId: string, enabled: boolean, alreadyRead: boolean) {
  const markRead = useMarkArticleRead();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    if (alreadyRead) {
      firedRef.current = true;
      return;
    }

    firedRef.current = false;

    const fire = (trigger: ReadTrigger) => {
      if (firedRef.current) return;
      firedRef.current = true;
      markRead.mutate({ articleId, trigger });
    };

    function onScroll() {
      if (window.scrollY > SCROLL_THRESHOLD_PX) {
        window.removeEventListener("scroll", onScroll);
        fire("scrolled");
      }
    }
    window.addEventListener("scroll", onScroll);

    let remainingMs = DWELL_MS;
    let segmentStartedAt = Date.now();
    let timerId: ReturnType<typeof setTimeout> | undefined;

    function startTimer() {
      segmentStartedAt = Date.now();
      timerId = setTimeout(() => fire("dwell_45s"), remainingMs);
    }

    function stopTimer() {
      if (timerId === undefined) return;
      clearTimeout(timerId);
      timerId = undefined;
      remainingMs = Math.max(0, remainingMs - (Date.now() - segmentStartedAt));
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    }

    if (!document.hidden) {
      startTimer();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopTimer();
    };
    // markRead is intentionally omitted: its identity changes every render,
    // and including it would restart the scroll/dwell listeners on each one.
  }, [articleId, enabled, alreadyRead]);
}
