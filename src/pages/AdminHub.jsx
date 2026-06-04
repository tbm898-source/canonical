import React from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  ClipboardList,
  Lock,
  PlugZap,
  Settings2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavModel } from "@/hooks/use-nav-model";

const adminLinks = [
  {
    to: "/ProgramHelper?mode=owner",
    title: "Owner workbench",
    text: "Full session tools, connectors, draft review, and PRISM panels.",
    icon: ClipboardList,
  },
  {
    to: "/OwnerAssistant",
    title: "Owner Assistant",
    text: "PRISM program generation, source records, and artifact planning.",
    icon: Bot,
  },
  {
    to: "/Dashboard",
    title: "Overview",
    text: "Preview of inbox lanes, review queue, and connector categories.",
    icon: Shield,
  },
  {
    to: "/Settings",
    title: "Settings & health",
    text: "Role, connector posture, governance, and external monitor links.",
    icon: Settings2,
  },
  {
    to: "/Integrations",
    title: "Integrations",
    text: "Connector rules and live control entry points.",
    icon: PlugZap,
  },
];

export default function AdminHub() {
  const { ownerAccess } = useNavModel();

  if (!ownerAccess.allowed) {
    return <Navigate to="/start" replace />;
  }

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-8">
      <div className="mb-2 flex items-center gap-2 text-indigo-600">
        <Lock className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">Admin only</p>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">Admin hub</h1>
      <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/55">
        Advanced tools stay here so class view stays simple. Nothing is removed — only grouped.
      </p>

      <ul className="mt-8 space-y-3">
        {adminLinks.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="flex min-h-[var(--tap-min)] items-start gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:border-indigo-100"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <item.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[#0a0a0a]">{item.title}</div>
                <p className="mt-1 text-sm leading-6 text-[#0a0a0a]/50">{item.text}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#0a0a0a]/30" />
            </Link>
          </li>
        ))}
      </ul>

      <Link to="/ProgramHelper?mode=owner#integrations" className="mt-6 block">
        <Button className="h-12 w-full rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]">
          Open connector panel
        </Button>
      </Link>
    </div>
  );
}
