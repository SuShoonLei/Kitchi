"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { HoloCard } from "@/components/holo/holo-card";
import { Sparkle } from "@/components/ui/doodles";
import { Badge } from "@/components/ui/sticker";
import { formatMoney } from "@/lib/format";
import type { WeekSummary } from "@/lib/types";
import { formatWeekLabel, isCurrentWeek } from "@/lib/week";

export function WeekFolderCard({
  summary,
  index,
  currency,
}: {
  summary: WeekSummary;
  index: number;
  currency: string;
}) {
  const reduce = useReducedMotion();
  const current = isCurrentWeek(summary.weekStart);
  const label = formatWeekLabel(summary.weekStart, summary.weekEnd);
  const spent = summary.groceryTotal + summary.eatingOutTotal;
  const savedLabel =
    summary.foodSavedCount === 0
      ? "Nothing rescued yet"
      : summary.foodSavedCount === 1
        ? "1 food saved"
        : `${summary.foodSavedCount} foods saved`;

  return (
    <motion.li
      className="flex min-w-0 justify-center"
      initial={reduce ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: reduce ? 0 : index * 0.07,
        duration: reduce ? 0 : 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <HoloCard
        current={current}
        label={`Week of ${label}. ${formatMoney(spent, currency)} spent. ${savedLabel}. Activate to flip.`}
        front={
          <div className="folder-face">
            <div className="folder-tab">{current ? "Week" : "Filed"}</div>
            <div className={`folder-sheet ${current ? "folder-sheet--current" : ""}`}>
              {current ? <span className="week-sticker">This week</span> : null}
              <p className="folder-kicker">Kitchi</p>
              <h3 className="folder-dates">{label}</h3>
              <p className="folder-amount">{formatMoney(spent, currency)}</p>
              <p className="folder-amount-label">spent this week</p>
              <Badge tone={summary.foodSavedCount > 0 ? "green" : "quiet"} className="mt-2 self-start">
                {savedLabel}
              </Badge>
              <Sparkle className="folder-doodle" />
              <p className="folder-hint">Flip for the breakdown</p>
            </div>
          </div>
        }
        back={
          <div className="folder-face">
            <div className="folder-tab">Breakdown</div>
            <div className="folder-sheet folder-sheet--ruled">
              <p className="folder-kicker">{current ? "This week" : "Filed week"}</p>
              <h3 className="folder-dates">{label}</h3>
              <dl className="folder-rows">
                <div className="folder-row">
                  <dt>
                    <span className="expiry-dot" data-expiry="urgent" />
                    Groceries
                  </dt>
                  <dd>{formatMoney(summary.groceryTotal, currency)}</dd>
                </div>
                <div className="folder-row">
                  <dt>
                    <span className="expiry-dot" data-expiry="soon" />
                    Eating out
                  </dt>
                  <dd>{formatMoney(summary.eatingOutTotal, currency)}</dd>
                </div>
                <div className="folder-row">
                  <dt>
                    <span className="expiry-dot" data-expiry="fresh" />
                    Money saved
                  </dt>
                  <dd>{formatMoney(summary.moneySaved, currency)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm font-bold text-kitchi-navy/70">{savedLabel}</p>
              <Link
                href={`/spending?week=${summary.weekStart}`}
                className="folder-link"
              >
                View details
              </Link>
            </div>
          </div>
        }
      />
    </motion.li>
  );
}
