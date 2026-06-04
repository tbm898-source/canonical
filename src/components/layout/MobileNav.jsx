import React from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Shown first — classroom / substitute friendly. */
export const CLASSROOM_NAV_LINKS = [
  {
    to: "/ProgramHelper?mode=demo",
    label: "Today's class",
    variant: "demo",
    primary: true,
  },
  { to: "/field-proof-week1", label: "Week 1 example" },
  { to: "/HowItWorks", label: "How it works" },
  { to: "/start", label: "Quick start" },
];

/** Operator / builder links — secondary in mobile menu. */
export const OPERATOR_NAV_LINKS = [
  { to: "/About", label: "About" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/Integrations", label: "Integrations" },
  { to: "/Proof", label: "Proof" },
  { to: "/Docs", label: "Docs" },
  { to: "/Home#faq", label: "FAQ" },
  { to: "/WorkspaceSetup", label: "Workspace setup" },
  { to: "/Dashboard", label: "Operator dashboard", requiresAuth: true },
  { to: "/Settings", label: "Settings", requiresAuth: true },
];

/** Desktop: classroom links + a few essentials; full list in mobile sheet. */
export const DESKTOP_NAV_LINKS = [
  ...CLASSROOM_NAV_LINKS,
  { to: "/About", label: "About" },
  { to: "/portfolio", label: "Portfolio" },
];

export const PUBLIC_NAV_LINKS = [...CLASSROOM_NAV_LINKS, ...OPERATOR_NAV_LINKS];

function BrandMark() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0a0a0a]">
      <span className="text-xs font-bold tracking-tight text-white">C</span>
    </div>
  );
}

function navLinkClassName(variant, primary = false) {
  if (variant === "demo" || primary) {
    return "inline-flex min-h-11 items-center rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700";
  }
  return "flex min-h-11 items-center text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]";
}

function NavLink({ to, label, variant, primary, onClick }) {
  return (
    <Link to={to} className={navLinkClassName(variant, primary)} onClick={onClick}>
      {label}
    </Link>
  );
}

export function DesktopNavLinks({ className = "" }) {
  return (
    <div className={`items-center gap-3 lg:gap-4 ${className}`}>
      {DESKTOP_NAV_LINKS.map(({ to, label, variant, primary }) => (
        <NavLink key={to} to={to} label={label} variant={variant} primary={primary} />
      ))}
    </div>
  );
}

function MobileNavSections() {
  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
        For class today
      </p>
      <nav className="mt-2 flex flex-col gap-1">
        {CLASSROOM_NAV_LINKS.map(({ to, label, variant, primary }) => (
          <SheetClose asChild key={to}>
            <NavLink to={to} label={label} variant={variant} primary={primary} />
          </SheetClose>
        ))}
      </nav>
      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0a0a0a]/35">
        More (operators)
      </p>
      <nav className="mt-2 flex flex-col gap-1">
        {OPERATOR_NAV_LINKS.map(({ to, label }) => (
          <SheetClose asChild key={to}>
            <NavLink to={to} label={label} />
          </SheetClose>
        ))}
      </nav>
    </>
  );
}

export function MobileNavMenu({ className = "" }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={`h-11 w-11 shrink-0 rounded-xl border-black/10 bg-white ${className}`}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5 text-[#0a0a0a]" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-[min(100vw-1rem,20rem)] flex-col gap-0 overflow-y-auto border-black/5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-[#0a0a0a]">CANONICAL</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <MobileNavSections />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Fixed top nav with safe-area padding for iOS/Android. */
export function PublicSiteNav() {
  return (
    <nav
      className="canonical-fixed-nav fixed left-0 right-0 top-0 z-50 border-b border-black/5 bg-[#fafafa]/85 backdrop-blur-xl"
      aria-label="Site"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/Home" className="flex min-w-0 items-center gap-2">
          <BrandMark />
          <span className="truncate text-[15px] font-semibold tracking-tight text-[#0a0a0a]">
            CANONICAL
          </span>
        </Link>
        <DesktopNavLinks className="hidden md:flex" />
        <MobileNavMenu className="md:hidden" />
      </div>
    </nav>
  );
}

export default PublicSiteNav;
