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

function BrandMark({ small = false }) {
  return (
    <div
      className={`${small ? "h-7 w-7 rounded-lg" : "h-10 w-10 rounded-xl"} flex shrink-0 items-center justify-center bg-[#0a0a0a]`}
    >
      <span className={`${small ? "text-xs" : "text-sm"} font-bold tracking-tight text-white`}>C</span>
    </div>
  );
}

function ModeBadge({ owner }) {
  return (
    <span
      className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide sm:inline-flex ${
        owner
          ? "border border-indigo-200 bg-indigo-50 text-indigo-700"
          : "border border-slate-200 bg-white text-slate-600"
      }`}
    >
      {owner ? "Owner" : "Demo"}
    </span>
  );
}

function WorkbenchSectionLinks({ links, className }) {
  const linkClass =
    "min-h-11 flex items-center text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]";

  return (
    <div className={className}>
      {links.map((item) =>
        item.to ? (
          <Link key={item.key} to={item.to} className={linkClass}>
            {item.label}
          </Link>
        ) : (
          <a key={item.key} href={item.href} className={linkClass}>
            {item.label}
          </a>
        ),
      )}
    </div>
  );
}

export function buildWorkbenchNavLinks({ summaryOnly, owner }) {
  const links = [
    { key: "field-proof", to: "/field-proof-week1", label: "Field proof" },
    { key: "programs", href: "#program-library", label: "Programs" },
    { key: "packages", href: "#package-library", label: "Packages" },
  ];

  if (!summaryOnly) {
    links.push(
      { key: "session", href: "#session", label: "Session" },
      { key: "artifacts", href: "#artifacts", label: "Artifacts" },
      { key: "agent", href: "#agent-demo", label: "Agent demo" },
      { key: "integrations", href: "#integrations", label: "Integrations" },
    );
    if (owner) {
      links.push({ key: "helper", href: "#helper", label: "Helper" });
    }
  }

  if (owner) {
    links.push({ key: "owner-assistant", to: "/OwnerAssistant", label: "Owner Assistant" });
  }

  links.push(
    { key: "settings", to: "/Settings", label: "Settings" },
    { key: "home", to: "/Home", label: "Home" },
  );

  return links;
}

function WorkbenchMobileMenu({ links, owner }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-xl border-black/10 bg-white md:hidden"
          aria-label="Open workbench sections"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(100vw-1rem,20rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-[#0a0a0a]">Workbench</SheetTitle>
        </SheetHeader>
        <p className="mt-1 text-xs text-[#0a0a0a]/50">
          {owner ? "Owner / admin workbench" : "Demo viewer — safe summary only"}
        </p>
        <nav className="mt-6 flex flex-col gap-1">
          {links.map((item) => (
            <SheetClose asChild key={item.key}>
              {item.to ? (
                <Link to={item.to} className="min-h-11 flex items-center text-sm text-[#0a0a0a]/70">
                  {item.label}
                </Link>
              ) : (
                <a href={item.href} className="min-h-11 flex items-center text-sm text-[#0a0a0a]/70">
                  {item.label}
                </a>
              )}
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/** Landing screen before demo/owner workbench is entered. */
export function ProgramHelperLandingNav({ onOpenDemo }) {
  return (
    <nav className="canonical-fixed-nav fixed left-0 right-0 top-0 z-50 border-b border-black/5 bg-[#fafafa]/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[var(--canonical-nav-height)] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/Home" className="flex min-w-0 items-center gap-2">
          <BrandMark small />
          <span className="truncate text-[15px] font-semibold tracking-tight text-[#0a0a0a]">
            CANONICAL
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/field-proof-week1"
            className="hidden min-h-11 items-center text-sm font-medium text-indigo-600 sm:flex"
          >
            Field proof
          </Link>
          <Button
            type="button"
            variant="outline"
            className="hidden h-11 rounded-xl sm:inline-flex"
            onClick={onOpenDemo}
          >
            Open demo
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-black/10 sm:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(100vw-1rem,20rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]"
            >
              <SheetHeader className="text-left">
                <SheetTitle>Program Helper</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                <SheetClose asChild>
                  <Link to="/field-proof-week1" className="min-h-11 flex items-center text-sm">
                    Field proof
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <button
                    type="button"
                    className="min-h-11 flex w-full items-center text-left text-sm font-medium text-indigo-600"
                    onClick={onOpenDemo}
                  >
                    Open demo viewer
                  </button>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/Home" className="min-h-11 flex items-center text-sm text-[#0a0a0a]/60">
                    Home
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

/** Workbench top nav with section jumps and mobile sheet. */
export function ProgramHelperWorkbenchNav({ owner, summaryOnly }) {
  const links = buildWorkbenchNavLinks({ summaryOnly, owner });

  return (
    <nav className="canonical-fixed-nav fixed left-0 right-0 top-0 z-50 border-b border-black/5 bg-[#fafafa]/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[var(--canonical-nav-height)] max-w-7xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        <Link to="/Home" className="flex min-w-0 items-center gap-2">
          <BrandMark small />
          <span className="truncate text-[15px] font-semibold tracking-tight text-[#0a0a0a]">
            CANONICAL
          </span>
          <ModeBadge owner={owner} />
        </Link>
        <WorkbenchSectionLinks
          links={links.filter((l) => l.key !== "home")}
          className="hidden items-center gap-4 lg:flex"
        />
        <WorkbenchMobileMenu links={links} owner={owner} />
      </div>
    </nav>
  );
}
