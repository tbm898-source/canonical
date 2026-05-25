import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Archive,
  Bot,
  ClipboardCheck,
  FileText,
  GitBranch,
  Layers,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const sections = [
  {
    icon: Archive,
    title: "File-first memory",
    text: "CANONICAL keeps files, packets, source notes, exports, manifests, and review queues connected to a durable spine instead of scattered across tools.",
  },
  {
    icon: Bot,
    title: "AI workflow routing",
    text: "Agent outputs are treated as drafts, classified by rail and visibility, and reviewed before they become official project memory.",
  },
  {
    icon: FileText,
    title: "Material generation",
    text: "Instructional notes can become session briefs, packets, slide outlines, classroom posts, evidence prompts, and export metadata.",
  },
  {
    icon: ClipboardCheck,
    title: "Evidence and continuity",
    text: "The system preserves what happened, what remains, what was blocked, what was learned, and what should happen next.",
  },
];

const rails = [
  {
    title: "AYA / CTS Rail",
    label: "Classroom-facing",
    text: "Student-safe and institution-safe materials for Alternative Youth Activities and CTS delivery: lesson packets, instructions, logs, checks, and classroom-ready exports.",
  },
  {
    title: "PRISM Rail",
    label: "Operator framework",
    text: "Private facilitator and system architecture: adaptive logic, framework scaffolds, continuity notes, diagnostics, and owner-only reasoning.",
  },
  {
    title: "CANONICAL Rail",
    label: "Durable spine",
    text: "The source-of-truth layer for manifests, templates, artifact records, program structure, import logs, and approved export history.",
  },
];

function BrandMark() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0a0a0a]">
      <span className="text-xs font-bold tracking-tight text-white">C</span>
    </div>
  );
}

function PublicNav() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-black/5 bg-[#fafafa]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/Home" className="flex items-center gap-2">
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-tight text-[#0a0a0a]">
            CANONICAL
          </span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/About" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
            About
          </Link>
          <Link to="/Dashboard" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
            Operator Dashboard
          </Link>
          <Link to="/WorkspaceSetup" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
            Workspace Setup
          </Link>
          <Link to="/ProgramHelper?mode=demo" className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800">
            Demo Viewer
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-black/5 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-xs text-[#0a0a0a]/40 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-[#0a0a0a]/60">Gordian Knot Consulting LLC</div>
          <div>Built by Tim Milkewicz - PRISM / CANONICAL systems architecture</div>
        </div>
        <div className="text-left sm:text-right">
          <div>CANONICAL Core v0.1</div>
          <div>Private operator buildout / public overview</div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fafafa]">
      <PublicNav />

      <main>
        <section className="relative px-6 pb-24 pt-36 sm:pt-44">
          <div className="absolute right-0 top-20 hidden h-96 w-1/2 pointer-events-none lg:block">
            <div className="grid grid-cols-4 gap-3 opacity-[0.04]">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-[#0a0a0a]" />
              ))}
            </div>
          </div>

          <motion.div initial="hidden" animate="visible" className="mx-auto max-w-6xl">
            <motion.div variants={fadeUp} custom={0} className="max-w-4xl">
              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-[#0a0a0a] sm:text-7xl">
                Project memory,
                <br />
                curriculum systems,
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  AI workflow infrastructure.
                </span>
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#0a0a0a]/55">
                CANONICAL is a structured operating system for turning scattered projects, class materials, AI outputs, files, workflows, and institutional memory into one coherent working spine.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#0a0a0a]/45">
                Built for educators, operators, builders, and small organizations that need their work to survive across tools, people, devices, and time.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link to="/ProgramHelper?mode=demo">
                  <Button className="h-12 gap-2 rounded-xl bg-[#0a0a0a] px-6 text-sm font-medium text-white transition-all hover:gap-3 hover:bg-[#1a1a1a]">
                    Open Demo Viewer
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/WorkspaceSetup">
                  <Button variant="outline" className="h-12 rounded-xl px-6 text-sm font-medium">
                    View setup path
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section className="border-y border-black/5 bg-white/70 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">
                What CANONICAL does
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/50">
                It is not a generic metrics dashboard. It is a practical control surface for making important work findable, reusable, reviewable, and exportable.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {sections.map((item, i) => (
                <motion.article
                  key={item.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-3xl border border-black/5 bg-[#fafafa] p-6"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50">
                    <item.icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-semibold text-[#0a0a0a]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/50">{item.text}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <Shield className="mb-5 h-9 w-9 text-indigo-600" />
                <h2 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">
                  Three rails, one spine.
                </h2>
                <p className="mt-4 text-sm leading-6 text-[#0a0a0a]/50">
                  CANONICAL keeps public overview material, classroom delivery assets, and private PRISM framework material from being accidentally blended together.
                </p>
              </div>
              <div className="grid gap-3">
                {rails.map((rail) => (
                  <article key={rail.title} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-[#0a0a0a]">{rail.title}</h3>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        {rail.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/50">{rail.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-6xl rounded-3xl bg-[#0a0a0a] p-10 sm:p-14">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <GitBranch className="h-5 w-5 text-white" />
                </div>
                <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  See the current Program Helper prototype.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50">
                  The demo view shows safe sample material. The owner workbench opens private scaffolds and integration controls only for an authenticated owner/admin.
                </p>
              </div>
              <Link to="/ProgramHelper?mode=demo">
                <Button className="h-12 gap-2 rounded-xl bg-white px-6 text-sm font-medium text-[#0a0a0a] hover:bg-white/90">
                  Launch Program Helper
                  <Layers className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
