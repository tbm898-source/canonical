import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AdminAuditLog from "@/components/dashboard/AdminAuditLog";
import {
  ArrowLeft,
  Archive,
  Bot,
  ClipboardList,
  DatabaseZap,
  FileCheck2,
  FileText,
  GraduationCap,
  Lock,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const dashboardCards = [
  {
    icon: Archive,
    title: "Canonical Inbox",
    status: "Intake lane",
    text: "Downloads, notes, exports, and generated drafts enter review before becoming official records.",
  },
  {
    icon: FileText,
    title: "Recent Materials",
    status: "Preview only",
    text: "Track the latest packets, guides, worksheets, slide outlines, manifests, and classroom-ready drafts.",
  },
  {
    icon: Bot,
    title: "Class Session Builder",
    status: "Draft then approve",
    text: "Turn hybrid notes into a normalized session brief and downstream AYA/PRISM bundle plan.",
  },
  {
    icon: GraduationCap,
    title: "AYA Rail",
    status: "Classroom-safe",
    text: "Student-facing and institution-facing outputs stay clean, practical, and separated from private PRISM notes.",
  },
  {
    icon: Lock,
    title: "PRISM Rail",
    status: "Owner-private",
    text: "Private framework scaffolds, facilitator overlays, and operator reasoning remain gated by mode and visibility.",
  },
  {
    icon: RefreshCcw,
    title: "Review Queue",
    status: "Human approval",
    text: "Generated work is staged for review before filing, publishing, exporting, or live connector use.",
  },
  {
    icon: FileCheck2,
    title: "Generated Artifacts",
    status: "Classified",
    text: "Every packet records rail, visibility, artifact type, module/session keys, warnings, and manifest data.",
  },
  {
    icon: DatabaseZap,
    title: "Connector Health",
    status: "Owner-only",
    text: "Dropbox, Classroom, ClickUp, and future email adapters remain disabled in public/demo mode.",
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-black/5 bg-[#fafafa]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/Home" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0a0a0a]">
              <span className="text-xs font-bold tracking-tight text-white">C</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[#0a0a0a]">
              CANONICAL
            </span>
          </Link>
          <Link to="/Home">
            <Button variant="ghost" size="sm" className="gap-2 text-[#0a0a0a]/50 hover:text-[#0a0a0a]">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </nav>

      <main className="px-6 pb-24 pt-32">
        <div className="mx-auto max-w-6xl">
          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 max-w-3xl"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Operator Dashboard
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a] sm:text-5xl">
              A public preview of what the private dashboard tracks.
            </h1>
            <p className="mt-5 text-sm leading-6 text-[#0a0a0a]/50">
              Track inbox, requests, generated artifacts, review status, connector health, and rail separation. This page shows dashboard categories, not private data; live status, raw files, source internals, and approval actions stay inside owner mode.
            </p>
          </motion.header>

          <section className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
                Source of truth
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0a0a0a]">CANONICAL file spine</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
                Public mode
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0a0a0a]">Preview only</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
                Live writes
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0a0a0a]">Owner approval required</div>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card, index) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50">
                  <card.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[#0a0a0a]">{card.title}</h3>
                  <span className="shrink-0 rounded-full bg-[#fafafa] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0a0a0a]/45">
                    {card.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/50">{card.text}</p>
              </motion.article>
            ))}
          </section>

          <AdminAuditLog />

          <section className="mt-10 rounded-3xl border border-indigo-100 bg-indigo-50 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[#0a0a0a]">
                  Want the working owner side?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/50">
                  The Program Helper opens the authenticated owner workbench with connector diagnostics, package proof, and review-before-write controls.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/ProgramHelper?mode=owner">
                  <Button className="gap-2 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]">
                    Open Owner Workbench
                    <ClipboardList className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/OwnerAssistant">
                  <Button variant="outline" className="gap-2 rounded-xl">
                    Open Owner Assistant
                    <Bot className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/ProgramHelper?mode=demo">
                  <Button variant="outline" className="gap-2 rounded-xl">
                    Open Demo Viewer
                    <ClipboardList className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}