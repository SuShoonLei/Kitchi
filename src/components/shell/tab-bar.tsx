"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/shell/nav";
import { NavIcon } from "@/components/shell/nav-icons";

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t-[2.5px] border-kitchi-navy bg-kitchi-cream px-1 pt-1 md:hidden"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="grid grid-cols-7">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const isAdd = item.href === "/add";
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={`relative flex min-h-14 flex-col items-center justify-end gap-0.5 rounded-xl px-0.5 pb-1 text-[0.62rem] font-extrabold tracking-tight text-kitchi-navy ${isAdd ? "-mt-3" : ""}`}
              >
                {active ? (
                  <motion.span
                    layoutId="tab-active"
                    className="nav-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span
                  className={`relative z-10 grid place-items-center ${isAdd ? "sticker-press sticker-press--icon bg-kitchi-red text-kitchi-cream" : "h-6 w-6"}`}
                >
                  <NavIcon name={item.icon} className={isAdd ? "h-5 w-5" : "h-5 w-5"} />
                </span>
                <span className="relative z-10">{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
