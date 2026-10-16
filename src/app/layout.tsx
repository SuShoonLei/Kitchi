import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { QueryProvider } from "@/components/query-provider";
import { AppShell } from "@/components/shell/app-shell";
import { LOGO_SRC } from "@/lib/brand";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kitchi – Waste Less, Taste Best",
    template: "%s · Kitchi",
  },
  description:
    "Waste less, taste best. Kitchi helps you cook what you already bought, rescue food before it expires, and keep a cheerful tally of grocery and eating-out spending.",
  applicationName: "Kitchi",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${baloo.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <link rel="preload" href={LOGO_SRC} as="image" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(sessionStorage.getItem("kitchi:splash")==="1")document.documentElement.dataset.kitchiSplash="done";if(localStorage.getItem("kitchi:onboarded")==="1")document.documentElement.dataset.kitchiOnboarded="done";}catch(e){}})();`,
          }}
        />
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
