import React, { useEffect } from "react";
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
import { PublicSiteNav } from "@/components/layout/MobileNav";
import SubstituteQuickPath from "@/components/layout/SubstituteQuickPath";
import { Link, useLocation } from "react-router-dom";

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

const systemTiles = [
  {
    title: "Material Requests",
    text: "Intake prompts, notes, and messy starts.",
  },
  {
    title: "Class Packets",
    text: "Packets, handouts, quizzes, and print sets.",
  },
  {
    title: "Rail Separation",
    text: "AYA-safe, PRISM-private, and demo-safe routing.",
  },
  {
    title: "Review Queue",
    text: "Drafts pause before becoming official memory.",
  },
  {
    title: "Evidence Notes",
    text: "What happened, what changed, and what remains.",
  },
  {
    title: "Connector Health",
    text: "Dropbox, Classroom, ClickUp, and dry-run status.",
  },
];

const workflowSteps = [
  {
    title: "Request",
    text: "Submit a material request or paste rough class notes into the workbench.",
  },
  {
    title: "Generate",
    text: "Create classroom or operator assets from the selected program context.",
  },
  {
    title: "Review",
    text: "Check rail separation, visibility, evidence, and export safety before filing.",
  },
  {
    title: "File",
    text: "Attach manifests and place approved work into the CANONICAL spine.",
  },
  {
    title: "Export",
    text: "Prepare PDF, DOCX, slides, ZIP, Classroom, ClickUp, or Dropbox outputs.",
  },
];

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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is CANONICAL?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CANONICAL is a file-first operating spine for project memory, curriculum systems, AI workflow routing, evidence capture, and program material organization."
      }
    },
    {
      "@type": "Question",
      "name": "Who is CANONICAL for?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CANONICAL is built for educators, operators, builders, and small organizations that need important work to survive across tools, people, devices, and time."
      }
    },
    {
      "@type": "Question",
      "name": "What does the Program Helper do?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Program Helper turns rough instructional notes into session briefs, class packets, slide outlines, export metadata, and safe AYA/PRISM rail outputs."
      }
    },
    {
      "@type": "Question",
      "name": "Does CANONICAL connect to Dropbox, Google Classroom, or ClickUp?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CANONICAL is designed for connector workflows. Dropbox is treated as the CANONICAL file spine, while Google Classroom and ClickUp are dry-run or adapter surfaces until owner approval."
      }
    }
  ]
};

const faqs = faqSchema.mainEntity.map((item) => ({
  question: item.name,
  answer: item.acceptedAnswer.text,
}));

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-schema";
    script.text = JSON.stringify(faqSchema);
    document.head.appendChild(script);
    return () => {
      const existing = document.getElementById("faq-schema");
      if (existing) existing.remove();
    };
  }, []);

  useEffect(() => {
    const hash = location.hash?.replace("#", "");
    if (!hash) return;
    window.requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#fafafa]">
      <PublicSiteNav />

      <main>
        <section className="canonical-page-top relative px-6 pb-24">
          <motion.div
            initial="hidden"
            animate="visible"
            className="mx-auto grid max-w-6xl gap-12 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] xl:items-center"
          >
            <motion.div variants={fadeUp} custom={0} className="max-w-4xl xl:max-w-none">
              <p className="mb-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Works on phone, tablet, and computer
              </p>
              <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-[#0a0a0a] sm:text-6xl lg:text-7xl">
                Covering class today?
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Get materials in three taps.
                </span>
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#0a0a0a]/65">
                Sign in with the login your coordinator gave you, open today&apos;s class view, then print or copy
                the packet. The screens use plain labels, not operator jargon.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#0a0a0a]/55">
                When your access is no longer needed, your coordinator can remove the account. Owner and builder
                tools stay on a separate admin path.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/ProgramHelper?mode=demo" className="w-full sm:w-auto">
                  <Button className="h-12 w-full gap-2 rounded-xl bg-[#0a0a0a] px-6 text-base font-semibold text-white transition-all hover:bg-[#1a1a1a] sm:w-auto">
                    Open today&apos;s class
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/field-proof-week1" className="w-full sm:w-auto">
                  <Button variant="outline" className="h-12 w-full rounded-xl px-6 text-base font-medium sm:w-auto">
                    See Week 1 example
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="hidden xl:block">
              <div className="grid grid-cols-2 gap-3">
                {systemTiles.map((tile, i) => (
                  <div
                    key={tile.title}
                    className={`rounded-3xl border border-black/5 bg-white/75 p-4 shadow-sm backdrop-blur ${
                      i === 2 ? "col-span-2 border-indigo-200 bg-indigo-50/80" : ""
                    }`}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0a0a0a]/35">
                      0{i + 1}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-[#0a0a0a]">
                      {tile.title}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#0a0a0a]/55">
                      {tile.text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section id="substitute-quick-path" className="scroll-mt-28 px-6 pb-8">
          <div className="mx-auto max-w-6xl">
            <SubstituteQuickPath />
          </div>
        </section>

        <section className="border-y border-black/5 bg-white px-6 py-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="mx-auto max-w-6xl rounded-3xl border border-black/5 bg-[#fafafa] p-8 sm:p-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
              Field-tested in curriculum operations
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#0a0a0a] sm:text-3xl">
              From scattered plan to Week 1 operating spine
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#0a0a0a]/60">
              CANONICAL was used to turn an upcoming trades / pre-apprenticeship cohort
              plan into a complete Week 1 system: daily ops, student activities, evidence
              routines, task planning, classroom posts, print mapping, and missing-item
              tracking—without asking the instructor to hold it all in memory.
            </p>
            <Link to="/field-proof-week1" className="mt-6 inline-block">
              <Button className="h-11 gap-2 rounded-xl bg-[#0a0a0a] px-5 text-sm font-medium text-white hover:bg-[#1a1a1a]">
                Read the field proof
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </section>

        <section className="border-y border-black/5 bg-white/70 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">
                What CANONICAL does
              </h2>
              <p className="mt-3 text-base leading-7 text-[#0a0a0a]/60">
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
                  <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/60">{item.text}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
                  Request -&gt; Generate -&gt; Review -&gt; File -&gt; Export
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0a0a0a]">
                  The operating loop stays visible.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#0a0a0a]/60">
                Every useful output moves through the same spine: request the work, generate the draft, review the boundary, file the record, and export only what is approved.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              {workflowSteps.map((step, i) => (
                <motion.article
                  key={step.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
                >
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0a0a0a] text-sm font-semibold text-white">
                    {i + 1}
                  </div>
                  <h3 className="text-base font-semibold text-[#0a0a0a]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/60">{step.text}</p>
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
                    <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/60">{rail.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div id="faq" className="mx-auto mb-16 max-w-6xl scroll-mt-28 rounded-3xl border border-black/5 bg-white p-8 shadow-sm sm:p-10">
            <div className="mb-8 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
                FAQ
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0a0a0a]">
                Common questions, answered plainly.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/55">
                A quick overview for visitors, demo viewers, and future collaborators trying to understand what CANONICAL is before opening the workbench.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {faqs.map((item) => (
                <article key={item.question} className="rounded-2xl border border-black/5 bg-[#fafafa] p-5">
                  <h3 className="text-base font-semibold text-[#0a0a0a]">{item.question}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/60">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>

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
                  Open class view
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
