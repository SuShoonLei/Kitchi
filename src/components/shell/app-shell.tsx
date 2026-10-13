"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SplashScreen } from "@/components/brand/splash-screen";
import { BrandLogo } from "@/components/brand/brand-logo";
import { PageTransition } from "@/components/shell/page-transition";
import { Sidebar } from "@/components/shell/sidebar";
import { TabBar } from "@/components/shell/tab-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-root">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SplashScreen />
      <div id="app-content">
      <Sidebar />
      <div className="pb-24 md:pb-0 md:pl-[17.5rem]">
        <header className="border-b-[2.5px] border-kitchi-navy bg-kitchi-cream px-4 py-3 md:hidden">
          <Link href="/" className="inline-flex items-center rounded-full" aria-label="Kitchi, home">
            <BrandLogo compact />
          </Link>
        </header>
        <PageTransition>{children}</PageTransition>
      </div>
      <TabBar />
      </div>
    </div>
  );
}
