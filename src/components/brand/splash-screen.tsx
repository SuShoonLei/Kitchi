"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mascot } from "@/components/brand/mascot";
import { LOGO_SRC, MOTTO } from "@/lib/brand";
import { readSplashSeen, writeSplashSeen } from "@/lib/intro";

const MOTTO_WORDS = MOTTO.split(" ");
const FULL_MS = 1800;
const REDUCED_MS = 800;

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function splashSeen() {
  return readSplashSeen((key) => window.sessionStorage.getItem(key));
}

function markSplashDone() {
  writeSplashSeen((key, value) => window.sessionStorage.setItem(key, value));
  document.documentElement.dataset.kitchiSplash = "done";
}

export function SplashScreen({ onFinished }: { onFinished?: () => void }) {
  const alreadySeen = useSyncExternalStore(subscribe, splashSeen, () => false);
  const reduce = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const finished = useRef(false);
  const visible = !alreadySeen && !dismissed;

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    markSplashDone();
    setDismissed(true);
    onFinished?.();
  }, [onFinished]);

  const beginExit = useCallback(() => {
    setExiting(true);
  }, []);

  useLayoutEffect(() => {
    const content = document.getElementById("app-content");
    if (!visible) {
      content?.removeAttribute("inert");
      return;
    }
    content?.setAttribute("inert", "");
    return () => content?.removeAttribute("inert");
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const total = reduce ? REDUCED_MS : FULL_MS;
    const exitAt = Math.max(0, total - (reduce ? 180 : 280));
    const exitTimer = window.setTimeout(beginExit, exitAt);
    const doneTimer = window.setTimeout(finish, total);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [beginExit, finish, reduce, visible]);

  useEffect(() => {
    if (!visible) return;
    function early() {
      beginExit();
      window.setTimeout(finish, reduce ? 120 : 200);
    }
    window.addEventListener("pointerdown", early);
    window.addEventListener("keydown", early);
    return () => {
      window.removeEventListener("pointerdown", early);
      window.removeEventListener("keydown", early);
    };
  }, [beginExit, finish, reduce, visible]);

  if (!visible) return null;

  return (
    <motion.div
      className="splash"
      role="presentation"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: reduce ? 0.18 : 0.28, ease: "easeOut" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_SRC} alt="" width={1} height={1} className="pointer-events-none absolute h-px w-px opacity-0" />
      <div className="splash-lockup">
        {reduce ? (
          <>
            <Mascot mood="cooking" size="xl" />
            <p className="splash-motto">{MOTTO}</p>
          </>
        ) : (
          <>
            <motion.div
              className="splash-pot"
              initial={{ y: 48, scaleX: 0.92, scaleY: 1.08, opacity: 0 }}
              animate={{
                y: [48, -10, 0],
                scaleX: [0.92, 1.06, 0.98, 1],
                scaleY: [1.08, 0.94, 1.04, 1],
                opacity: 1,
              }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                animate={{ y: [0, -8, 0, -4, 0] }}
                transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
              >
                <Mascot mood="cooking" size="xl" />
              </motion.div>
            </motion.div>
            <p className="splash-motto splash-motto--words" aria-label={MOTTO}>
              {MOTTO_WORDS.map((word, index) => (
                <motion.span
                  key={word}
                  className="splash-motto-word"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85 + index * 0.12, duration: 0.28 }}
                >
                  {word}
                </motion.span>
              ))}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
