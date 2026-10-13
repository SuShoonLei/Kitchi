export const NAV_ITEMS = [
  { href: "/", label: "Home", shortLabel: "Home", icon: "home" },
  { href: "/pantry", label: "Pantry", shortLabel: "Pantry", icon: "pantry" },
  { href: "/add", label: "Add ingredients", shortLabel: "Add", icon: "add" },
  { href: "/recipes", label: "Meals", shortLabel: "Meals", icon: "recipes" },
  { href: "/grocery", label: "Grocery list", shortLabel: "List", icon: "grocery" },
  { href: "/spending", label: "Spending", shortLabel: "Spend", icon: "spending" },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: "settings" },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
export type NavIconName = NavItem["icon"];
export type NavHref = NavItem["href"];
