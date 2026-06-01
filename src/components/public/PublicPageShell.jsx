import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

function BrandMark() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0a0a0a]">
      <span className="text-xs font-bold tracking-tight text-white">C</span>
    </div>
  );
}

export function PublicNav() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-black/5 bg-[#fafafa]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/Home" className="flex items-center gap-2">
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-tight text-[#0a0a0a]">
            CANONICAL
          </span>
        </Link>
        <div className="hidden items-center gap-4 md:flex">
          <Link to="/About" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
            About
          </Link>
          <Link to="/portfolio" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
            Portfolio
          </Link>
          <Link to="/HowItWorks" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
            How It Works
          </Link>
          <Link to="/Proof" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
            Proof
          </Link>
          <Link to="/field-proof-week1" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
            Field proof
          </Link>
          <Link to="/Docs" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
            Docs
          </Link>
          <Link to="/Home#faq" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
            FAQ
          </Link>
          <Link to="/WorkspaceSetup" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
            Setup
          </Link>
          <Link to="/ProgramHelper?mode=demo" className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800">
            Demo
          </Link>
          <Link to="/ProgramHelper?mode=owner" className="text-sm font-medium text-[#0a0a0a] transition-colors hover:text-indigo-700">
            Owner
          </Link>
        </div>
      </div>
    </nav>
  );
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
          <Button variant="outline" size="sm" className="rounded-xl">
            Open Demo Viewer
          </Button>
        </Link>
        <Link to="/ProgramHelper?mode=owner">
          <Button size="sm" className="rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]">
            Owner Workbench
          </Button>
        </Link>
      </div>
    </footer>
  );
}

export default function PublicPageShell({ children }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafafa]">
      <PublicNav />
      <main className="px-6 pb-24 pt-32">{children}</main>
      <PublicFooter />
    </div>
  );
}
