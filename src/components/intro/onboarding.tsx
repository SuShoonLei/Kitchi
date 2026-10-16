"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Mascot, type MascotMood } from "@/components/brand/mascot";
import { Button, Chip } from "@/components/ui/sticker";
import { isLocalMode } from "@/lib/config";
import {
  advanceIntroStep,
  buildOnboardingSettings,
  parseBudgetInput,
  shouldMarkOnboarded,
  shouldSaveOnboarding,
  writeOnboarded,
} from "@/lib/intro";
import { CUISINES, type Cuisine, type Settings } from "@/lib/types";
import { useSaveSettings, useSettings } from "@/lib/use-journal";
import { useIntroStore } from "@/store/use-intro-store";

const COPY: { title: string; body: string; mood: MascotMood }[] = [
  {
    title: "Add what's in your fridge",
    body: "Snap a shelf, scan a barcode, or type it in. Everything lands in your pantry.",
    mood: "happy",
  },
  {
    title: "Cook before it spoils",
    body: "Meal ideas lean on the food that is closest to the edge first.",
    mood: "cooking",
  },
  {
    title: "Watch your savings grow",
    body: "Money rescued and weekly folders keep score of what you cooked instead of tossed.",
    mood: "celebrating",
  },
  {
    title: "Make it yours",
    body: "Pick the cuisines you cook and an optional weekly eating-out budget.",
    mood: "happy",
  },
];

const EMPTY_SETTINGS: Settings = {
  preferredCuisines: [],
  eatingOutBudgetWeekly: null,
  currency: "USD",
};

function markFlag() {
  writeOnboarded((key, value) => window.localStorage.setItem(key, value));
  document.documentElement.dataset.kitchiOnboarded = "done";
}

export function OnboardingOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const settings = useSettings();
  if (!open) return null;
  return (
    <OnboardingDialog
      initial={settings.data ?? EMPTY_SETTINGS}
      onClose={onClose}
    />
  );
}

function OnboardingDialog({
  initial,
  onClose,
}: {
  initial: Settings;
  onClose: () => void;
}) {
  const save = useSaveSettings();
  const showToast = useIntroStore((state) => state.showToast);
  const reduce = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const [step, setStep] = useState(0);
  const [cuisines, setCuisines] = useState<Cuisine[]>(initial.preferredCuisines);
  const [budget, setBudget] = useState(
    initial.eatingOutBudgetWeekly == null ? "" : String(initial.eatingOutBudgetWeekly),
  );
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement | null;
    const content = document.getElementById("app-content");
    content?.setAttribute("inert", "");
    const frame = window.requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>("button, input, [href]");
      first?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      content?.removeAttribute("inert");
      restoreFocus.current?.focus?.();
    };
  }, []);

  const finish = useCallback(
    async (intent: "finish" | "skipForNow") => {
      if (saving || celebrating) return;
      if (intent === "finish") {
        const parsed = parseBudgetInput(budget);
        if (!parsed.ok) {
          setBudgetError(parsed.error);
          setStep(3);
          return;
        }
        setBudgetError(null);
        setSaving(true);
        let succeeded: boolean | null = null;
        if (shouldSaveOnboarding(intent)) {
          const payload = buildOnboardingSettings({
            cuisines,
            budget: parsed.value,
            currency: initial.currency,
          });
          try {
            await save.mutateAsync(payload);
            succeeded = true;
          } catch {
            succeeded = false;
            showToast("Preferences can be set later in Settings.");
          }
        }
        setSaving(false);
        if (shouldMarkOnboarded(intent, succeeded)) markFlag();
        setCelebrating(true);
        window.setTimeout(onClose, reduce ? 350 : 700);
        return;
      }
      if (shouldMarkOnboarded(intent, null)) markFlag();
      onClose();
    },
    [budget, celebrating, cuisines, initial.currency, onClose, reduce, save, saving, showToast],
  );

  const go = useCallback((action: "next" | "back" | "skipToSetup") => {
    setStep((current) => advanceIntroStep(current, action));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        void finish("skipForNow");
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (step < 3) go("next");
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (step > 0) go("back");
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = [
        ...panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [finish, go, step]);

  function onPointerDown(event: ReactPointerEvent) {
    if ((event.target as HTMLElement).closest("button, input, a, label")) {
      touchX.current = null;
      return;
    }
    touchX.current = event.clientX;
  }

  function onPointerUp(event: ReactPointerEvent) {
    if (touchX.current == null) return;
    const dx = event.clientX - touchX.current;
    touchX.current = null;
    if (dx < -48 && step < 3) go("next");
    if (dx > 48 && step > 0) go("back");
  }

  function onSetupSubmit(event: FormEvent) {
    event.preventDefault();
    void finish("finish");
  }

  const copy = COPY[step];
  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -28 },
      };

  return (
    <div className="onboarding" role="presentation">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="onboarding-card sticker-card"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div className="onboarding-dots" role="tablist" aria-label="Intro steps">
          {COPY.map((item, index) => (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={index === step}
              aria-label={`Step ${index + 1}: ${item.title}`}
              className={`onboarding-dot ${index === step ? "onboarding-dot--active" : ""}`}
              onClick={() => setStep(index)}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={celebrating ? "celebrate" : step}
            className="onboarding-step"
            initial={slide.initial}
            animate={slide.animate}
            exit={slide.exit}
            transition={{ duration: reduce ? 0.18 : 0.28 }}
          >
            <Mascot mood={celebrating ? "celebrating" : copy.mood} size="lg" className="mx-auto" />
            <h2 id={titleId} className="mt-4 text-center text-3xl text-kitchi-navy">
              {celebrating ? "You are ready to cook!" : copy.title}
            </h2>
            {!celebrating ? (
              <p className="mx-auto mt-2 max-w-sm text-center text-kitchi-navy/75">{copy.body}</p>
            ) : null}

            {step === 3 && !celebrating ? (
              <form className="mt-5 space-y-4" onSubmit={onSetupSubmit}>
                <div role="group" aria-label="Cuisines you cook" className="flex flex-wrap justify-center gap-2">
                  {CUISINES.map((cuisine) => {
                    const pressed = cuisines.includes(cuisine);
                    return (
                      <Chip
                        key={cuisine}
                        pressed={pressed}
                        onClick={() =>
                          setCuisines((current) =>
                            current.includes(cuisine)
                              ? current.filter((item) => item !== cuisine)
                              : [...current, cuisine],
                          )
                        }
                      >
                        {cuisine}
                      </Chip>
                    );
                  })}
                </div>
                <label className="block text-sm font-extrabold text-kitchi-navy">
                  Weekly eating-out budget ({initial.currency})
                  <input
                    className="field mt-1"
                    inputMode="decimal"
                    value={budget}
                    placeholder="Optional"
                    onChange={(event) => setBudget(event.target.value)}
                    aria-invalid={budgetError ? true : undefined}
                  />
                </label>
                {budgetError ? <p className="text-sm font-bold text-kitchi-red">{budgetError}</p> : null}
                {isLocalMode() ? (
                  <p className="text-center text-sm font-bold text-kitchi-navy/65">Your data stays on this device.</p>
                ) : null}
                <Button type="submit" className="w-full min-h-11" disabled={saving}>
                  {saving ? "Saving…" : "Let's cook!"}
                </Button>
              </form>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {!celebrating ? (
          <div className="onboarding-actions">
            {step > 0 ? (
              <Button variant="steam" className="min-h-11" onClick={() => go("back")}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="steam" className="min-h-11" onClick={() => go("skipToSetup")}>
                  Skip
                </Button>
                <Button className="min-h-11" onClick={() => go("next")}>
                  Next
                </Button>
              </div>
            ) : (
              <Button
                variant="steam"
                className="min-h-11"
                onClick={() => void finish("skipForNow")}
                disabled={saving}
              >
                Skip for now
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
