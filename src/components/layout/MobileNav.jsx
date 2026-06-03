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

export const PUBLIC_NAV_LINKS = [
  { to: "/About", label: "About" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/HowItWorks", label: "How It Works" },
  { to: "/Proof", label: "Proof" },
  { to: "/field-proof-week1", label: "Field proof" },
  { to: "/Docs", label: "Docs" },
  { to: "/Home#faq", label: "FAQ" },
  { to: "/Dashboard", label: "Operator Dashboard" },
  { to: "/WorkspaceSetup", label: "Workspace Setup" },
  {
    to: "/ProgramHelper?mode=demo",
    label: "Demo Viewer",
    variant: "demo",
  },
];

function BrandMark() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0a0a0a]">
      <span className="text-xs font-bold tracking-tight text-white">C</span>
    </div>
  );
}

function navLinkClassName(variant) {
  if (variant === "demo") {
    return "text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800 min-h-11 flex items-center";
  }
  return "text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a] min-h-11 flex items-center";
}

export function DesktopNavLinks({ className = "" }) {
  return (
    <div className={`items-center gap-5 ${className}`}>
      {PUBLIC_NAV_LINKS.map(({ to, label, variant }) => (
        <Link key={to} to={to} className={navLinkClassName(variant)}>
          {label}
        </Link>
      ))}
    </div>
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
        className="flex w-[min(100vw-1rem,20rem)] flex-col gap-0 border-black/5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-[#0a0a0a]">CANONICAL</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {PUBLIC_NAV_LINKS.map(({ to, label, variant }) => (
            <SheetClose asChild key={to}>
              <Link to={to} className={navLinkClassName(variant)}>
                {label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/** Fixed top nav with safe-area padding for iOS/Android. */
export function PublicSiteNav() {
  return (
    <nav className="canonical-fixed-nav fixed left-0 right-0 top-0 z-50 border-b border-black/5 bg-[#fafafa]/85 backdrop-blur-xl">
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
