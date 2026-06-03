import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  Boxes,
  ClipboardList,
  FileCheck2,
  FolderGit2,
  GitBranch,
  Layers3,
  Mail,
  Network,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicPageShell from "@/components/public/PublicPageShell";
import {
  caseStudies,
  closingCta,
  ethicsSection,
  portfolioHero,
  proofCards,
  workflowStack,
} from "@content/site/portfolio.js";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const proofIcons = [Network, BookOpenCheck, ClipboardList, FolderGit2];
const caseIcons = [Layers3, GitBranch, BookOpenCheck, Wrench, FileCheck2];
const GKC_LOGO_SRC = "/assets/brand/gordian-knot-consulting-llc-logo.png";

function GkcLogoSlot() {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-white p-1.5 shadow-sm sm:h-[4.75rem] sm:w-[4.75rem]">
        <img
          src={GKC_LOGO_SRC}
          alt="Gordian Knot Consulting LLC"
          width={68}
          height={68}
          className="h-full w-full max-w-full object-contain"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#0a0a0a]">Gordian Knot Consulting LLC</p>
        <p className="text-xs leading-5 text-[#0a0a0a]/45">Field-built AI workflow systems</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, text }) {
  return (
    <div className="mb-10 max-w-3xl">
      <h2 className="text-3xl font-bold tracking-tight text-[#0a0a0a] sm:text-4xl">{title}</h2>
      {text ? <p className="mt-4 text-base leading-7 text-[#0a0a0a]/60">{text}</p> : null}
    </div>
  );
}

export default function Portfolio() {
  return (
    <PublicPageShell>
      <motion.div initial="hidden" animate="visible" className="mx-auto max-w-6xl">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] lg:items-center">
          <motion.div variants={fadeUp} custom={0}>
            <GkcLogoSlot />
            <h1 className="mt-8 max-w-4xl text-4xl font-bold leading-[1.06] tracking-tight text-[#0a0a0a] sm:text-6xl">
              {portfolioHero.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#0a0a0a]/62">
              {portfolioHero.subtitle}
            </p>
            <p className="mt-5 max-w-3xl border-l-2 border-indigo-500 pl-5 text-sm leading-7 text-[#0a0a0a]/58">
              {portfolioHero.credibility}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#case-studies">
                <Button className="h-12 gap-2 rounded-xl bg-[#0a0a0a] px-6 text-sm font-medium text-white transition-all hover:gap-3 hover:bg-[#1a1a1a]">
                  View Case Studies
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link to="/Home">
                <Button variant="outline" className="h-12 rounded-xl px-6 text-sm font-medium">
                  Explore CANONICAL
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="rounded-2xl bg-[#0a0a0a] p-6 text-white">
              <Boxes className="mb-5 h-9 w-9 text-white/80" />
              <h2 className="text-2xl font-bold tracking-tight">Field-built systems work</h2>
              <p className="mt-4 text-sm leading-6 text-white/58">
                Practical workflows for getting real material out of scattered notes, tool outputs, file piles, and half-remembered context.
              </p>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {["Context", "Drafts", "Review", "Handoff"].map((item, index) => (
                <div key={item} className="rounded-2xl bg-[#fafafa] p-4">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600">
                    {index + 1}
                  </div>
                  <h3 className="text-sm font-semibold text-[#0a0a0a]">{item}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#0a0a0a]/55">
                    {[
                      "Gather source material and separate private from public-safe context.",
                      "Use AI tools to shape useful artifacts without pretending drafts are finished.",
                      "Check privacy, rail boundaries, accuracy, and practical classroom or operations fit.",
                      "File decisions, next steps, and source records so the work can keep moving.",
                    ][index]}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mt-20 border-y border-black/5 bg-white/65 py-16">
          <div className="mx-auto max-w-6xl px-0">
            <SectionHeader
              title="What This Portfolio Proves"
              text="The focus is applied system-building: workflows, packets, documentation, continuity, and safe public proof."
            />
            <div className="grid gap-3 md:grid-cols-2">
              {proofCards.map((card, index) => {
                const Icon = proofIcons[index];
                return (
                  <motion.article
                    key={card.title}
                    variants={fadeUp}
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50">
                      <Icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h3 className="text-base font-semibold text-[#0a0a0a]">{card.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/60">{card.body}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="case-studies" className="mt-20 scroll-mt-28">
          <SectionHeader
            title="Case Studies"
            text="Sanitized examples of real system-building patterns, focused on workflow design and public-safe proof."
          />
          <div className="grid gap-4">
            {caseStudies.map((study, index) => {
              const Icon = caseIcons[index];
              return (
                <motion.article
                  key={study.title}
                  variants={fadeUp}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7"
                >
                  <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                    <div>
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a0a0a]">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                        {study.category}
                      </p>
                      <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#0a0a0a]">
                        {study.title}
                      </h3>
                      <p className="mt-4 text-sm leading-6 text-[#0a0a0a]/60">{study.summary}</p>
                    </div>
                    <div className="grid gap-4">
                      <div className="rounded-2xl bg-[#fafafa] p-5">
                        <h4 className="text-sm font-semibold text-[#0a0a0a]">Highlights</h4>
                        <ul className="mt-4 grid gap-2">
                          {study.highlights.map((highlight) => (
                            <li key={highlight} className="flex gap-3 text-sm leading-6 text-[#0a0a0a]/60">
                              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                        <h4 className="text-sm font-semibold text-[#0a0a0a]">Proof</h4>
                        <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/65">{study.proof}</p>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="mt-20">
          <SectionHeader
            title="Tools and Workflow Stack"
            text="A practical stack for moving from rough context to durable records, without treating any single tool as the source of truth."
          />
          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {workflowStack.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-black/5 bg-[#fafafa] px-4 py-2 text-sm font-medium text-[#0a0a0a]/68"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-3xl bg-[#0a0a0a] p-8 text-white sm:p-10">
          <ShieldCheck className="mb-5 h-9 w-9 text-white/80" />
          <h2 className="text-3xl font-bold tracking-tight">{ethicsSection.title}</h2>
          <p className="mt-5 max-w-4xl text-sm leading-7 text-white/58">{ethicsSection.body}</p>
        </section>

        <section className="mt-14 rounded-3xl border border-black/5 bg-white p-8 shadow-sm sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-[#0a0a0a] sm:text-4xl">
                {closingCta.title}
              </h2>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#0a0a0a]/60">{closingCta.body}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a href={closingCta.contactHref}>
                <Button className="h-12 gap-2 rounded-xl bg-[#0a0a0a] px-6 text-sm font-medium text-white hover:bg-[#1a1a1a]">
                  Contact Gordian Knot Consulting
                  <Mail className="h-4 w-4" />
                </Button>
              </a>
              <Link to="/Home">
                <Button variant="outline" className="h-12 rounded-xl px-6 text-sm font-medium">
                  Explore CANONICAL
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </motion.div>
    </PublicPageShell>
  );
}
