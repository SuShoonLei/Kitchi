"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NAV_ITEMS } from "@/components/shell/nav";
import { NavIcon } from "@/components/shell/nav-icons";
import { MOTTO } from "@/lib/brand";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17.5rem] flex-col border-r-[2.5px] border-kitchi-navy bg-kitchi-cream/95 px-4 py-6 md:flex">
      <Link href="/" aria-label={`Kitchi. ${MOTTO}`} className="block rounded-2xl px-2 py-1">
        <BrandLogo />
        <span className="mt-2 block px-1 text-sm font-extrabold text-kitchi-navy/70">{MOTTO}</span>
      </Link>
      <nav aria-label="Primary" className="mt-8 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 font-bold text-kitchi-navy"
            >
              {active ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="nav-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <NavIcon name={item.icon} className="relative z-10 h-6 w-6" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
