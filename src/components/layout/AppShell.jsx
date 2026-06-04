import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import BottomNav from "@/components/layout/BottomNav";
import { DesktopNavLinks, MobileNavMenu } from "@/components/layout/MobileNav";
import { useNavModel } from "@/hooks/use-nav-model";

function CompactTopNav() {
  return (
    <nav
      className="canonical-fixed-nav fixed left-0 right-0 top-0 z-50 border-b border-black/5 bg-[#fafafa]/85 backdrop-blur-xl"
      aria-label="Site"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/start" className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0a0a0a]">
            <span className="text-xs font-bold text-white">C</span>
          </div>
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

export default function AppShell() {
  const location = useLocation();
  const nav = useNavModel();
  const isProgramHelper = location.pathname === "/ProgramHelper";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {!isProgramHelper && <CompactTopNav />}
      <div
        className={
          isProgramHelper
            ? ""
            : "canonical-page-top canonical-page-with-bottom-nav mx-auto max-w-6xl px-4 pb-6 sm:px-6"
        }
      >
        <Outlet context={{ inAppShell: true, nav }} />
      </div>
      <BottomNav tabs={nav.tabs} />
    </div>
  );
}
