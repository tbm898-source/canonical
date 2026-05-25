import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Database,
  FileArchive,
  FolderTree,
  GitBranch,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: FolderTree,
    title: "Create the CANONICAL root folder",
    text: "Start with one durable folder spine for programs, imports, manifests, review queues, drafts, exports, and approved artifacts.",
  },
  {
    icon: GitBranch,
    title: "Add program rails",
    text: "Separate CANONICAL internal records, AYA / CTS classroom-facing materials, and PRISM private operator/framework materials.",
  },
  {
    icon: Database,
    title: "Connect Dropbox",
    text: "Use Dropbox as the durable file spine, but discover and map the existing structure before writing anything new.",
  },
  {
    icon: Bot,
    title: "Add the Base44 agent",
    text: "Give the helper clear instructions for session briefs, packet generation, AYA/PRISM separation, and export classification.",
  },
  {
    icon: ShieldCheck,
    title: "Set dry-run mode",
    text: "Classroom, ClickUp, and email adapters should prepare drafts first. Demo mode must never call backend connectors.",
  },
  {
    icon: PlugZap,
    title: "Approve live writes only after review",
    text: "Dropbox saves require a generated packet, safe classification, accepted spine map, and owner-approved destination path.",
  },
  {
    icon: FileArchive,
    title: "Generate the first material packet",
    text: "Convert rough notes into a session brief, AYA-safe outputs, curated PRISM framing, export metadata, and a manifest.",
  },
];

export default function WorkspaceSetup() {
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
            className="mb-12 max-w-3xl"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Workspace Setup
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a] sm:text-5xl">
              Build the spine before turning on the machine.
            </h1>
            <p className="mt-5 text-sm leading-6 text-[#0a0a0a]/50">
              This setup path keeps CANONICAL from becoming another sacred junk drawer with an API key taped to it. Start with structure, use dry-run adapters, and approve live writes only after review.
            </p>
          </motion.header>

          <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
              <CheckCircle2 className="mb-5 h-9 w-9 text-indigo-600" />
              <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
                Safe setup posture
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#0a0a0a]/50">
                V1 treats Dropbox as the first live connector, but discovery comes before writing. Google Classroom, ClickUp, and email remain prepared/dry-run adapters until owner approval and explicit live workflows exist.
              </p>
              <Link to="/ProgramHelper?mode=demo">
                <Button className="mt-6 gap-2 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]">
                  Open current helper
                  <Bot className="h-4 w-4" />
                </Button>
              </Link>
            </aside>

            <div className="grid gap-3">
              {steps.map((step, index) => (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.35 }}
                  className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                      <step.icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
                        Step {index + 1}
                      </div>
                      <h3 className="mt-1 text-base font-semibold text-[#0a0a0a]">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/50">{step.text}</p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
