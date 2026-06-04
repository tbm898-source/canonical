import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubstituteQuickPath from "@/components/layout/SubstituteQuickPath";
import { useNavModel } from "@/hooks/use-nav-model";

export default function Start() {
  const { user, roleLabel, primaryAction, ownerAccess } = useNavModel();

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Start</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0a0a0a] sm:text-4xl">
        What do you need right now?
      </h1>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#0a0a0a]/50">Signed in</p>
            <p className="mt-1 break-all text-sm font-medium text-[#0a0a0a]">
              {user?.email || "Your account"}
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {roleLabel}
          </span>
        </div>
      </div>

      <Link to={primaryAction.to} className="mt-6 block">
        <Button className="h-14 w-full gap-2 rounded-2xl bg-[#0a0a0a] text-base font-semibold text-white hover:bg-[#1a1a1a]">
          {primaryAction.label}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </Link>

      <Link
        to="/field-proof-week1"
        className="mt-3 flex min-h-[var(--tap-min)] items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-medium text-[#0a0a0a]/70"
      >
        See Week 1 example
      </Link>

      {ownerAccess.allowed && (
        <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
          <p className="text-sm font-semibold text-[#0a0a0a]">Admin tools</p>
          <p className="mt-1 text-sm leading-6 text-[#0a0a0a]/55">
            Owner workbench, connectors, and PRISM tools live under Admin.
          </p>
          <Link to="/admin" className="mt-4 inline-block">
            <Button variant="outline" className="h-11 rounded-xl">
              Open admin hub
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-10">
        <SubstituteQuickPath />
      </div>
    </div>
  );
}
