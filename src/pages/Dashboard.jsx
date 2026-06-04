import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicPageShell from "@/components/public/PublicPageShell";
import AdminAuditLog from "@/components/dashboard/AdminAuditLog";
import CollapsibleSection from "@/components/program-helper/CollapsibleSection";

const overviewCards = [
  {
    title: "Inbox & review",
    text: "New work enters intake, pauses for human review, then files to the spine.",
  },
  {
    title: "Class materials",
    text: "AYA-safe packets and classroom exports stay separate from private facilitator notes.",
  },
  {
    title: "Connectors",
    text: "Dropbox, Classroom, and ClickUp — owner approval before live writes.",
  },
];

export default function Dashboard() {
  return (
    <PublicPageShell>
      <div className="mx-auto max-w-2xl py-2 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Admin overview</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0a0a0a]">System at a glance</h1>
        <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/55">
          Categories only — no private data on this page. Open the workbench for live status and actions.
        </p>

        <ul className="mt-8 space-y-3">
          {overviewCards.map((card) => (
            <li key={card.title} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#0a0a0a]">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/50">{card.text}</p>
            </li>
          ))}
        </ul>

        <Link to="/admin" className="mt-6 block">
          <Button variant="outline" className="h-11 w-full rounded-xl">
            Back to admin hub
          </Button>
        </Link>

        <Link to="/ProgramHelper?mode=owner" className="mt-3 block">
          <Button className="h-12 w-full gap-2 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]">
            Open admin workbench
            <ClipboardList className="h-4 w-4" />
          </Button>
        </Link>

        <CollapsibleSection
          value="audit-log"
          title="Activity log"
          description="Recent operator events"
          className="mt-8"
        >
          <AdminAuditLog />
        </CollapsibleSection>

        <p className="mt-8 flex items-center gap-2 text-xs text-[#0a0a0a]/40">
          <Lock className="h-3.5 w-3.5" />
          Preview categories — live writes require owner workbench
          <Link to="/ProgramHelper?mode=demo" className="ml-auto text-indigo-600">
            Class view
            <ArrowRight className="ml-0.5 inline h-3 w-3" />
          </Link>
        </p>
      </div>
    </PublicPageShell>
  );
}
