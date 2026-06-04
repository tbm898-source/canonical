import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicSiteNav } from "@/components/layout/MobileNav";

export function PublicNav() {
  return <PublicSiteNav />;
}

export function PublicFooter() {
  return (
    <footer className="border-t border-black/5 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-xs text-[#0a0a0a]/40 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-[#0a0a0a]/60">Gordian Knot Consulting LLC</div>
          <div>CANONICAL Core v0.1 - private operator buildout / public overview</div>
        </div>
        <Link to="/ProgramHelper?mode=demo">
          <Button size="sm" className="rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]">
            Open today&apos;s class
          </Button>
        </Link>
      </div>
    </footer>
  );
}

export default function PublicPageShell({ children, showFooter = true }) {
  const outlet = useOutletContext();
  const inAppShell = Boolean(outlet?.inAppShell);

  if (inAppShell) {
    return <div className="overflow-x-hidden">{children}</div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafafa]">
      <PublicNav />
      <main className="canonical-page-top px-4 pb-24 sm:px-6">{children}</main>
      {showFooter ? <PublicFooter /> : null}
    </div>
  );
}
