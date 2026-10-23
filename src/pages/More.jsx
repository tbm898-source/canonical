import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { OPERATOR_NAV_LINKS } from "@/components/layout/MobileNav";
import { useNavModel } from "@/hooks/use-nav-model";

export default function More() {
  const { ownerAccess } = useNavModel();
  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-8">
      <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">More</h1>
      <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/55">
        Examples, background, and website settings. Your teaching work stays under Curriculum and Plan a class.
      </p>
      <ul className="mt-8 divide-y divide-black/5 rounded-2xl border border-black/5 bg-white shadow-sm">
        {OPERATOR_NAV_LINKS.filter((l) => !l.requiresAuth).map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="flex min-h-[var(--tap-min)] items-center justify-between px-4 text-sm font-medium text-[#0a0a0a]"
            >
              {link.label}
              <ArrowRight className="h-4 w-4 text-[#0a0a0a]/25" />
            </Link>
          </li>
        ))}
      </ul>
      {ownerAccess.allowed && <Link to="/admin" className="mt-5 flex min-h-12 items-center justify-between rounded-xl border border-slate-200 bg-white p-4 font-semibold text-slate-800">Website tools & settings <ArrowRight className="h-4 w-4" /></Link>}
      <p className="mt-6 text-center text-xs text-[#0a0a0a]/40">
        <Link to="/Home" className="text-indigo-600 hover:text-indigo-800">
          Full product overview
        </Link>
      </p>
    </div>
  );
}
