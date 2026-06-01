import React from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Layers, Route } from "lucide-react";
import PublicPageShell from "@/components/public/PublicPageShell";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const createdCategories = [
  "Week overview and daily instructor operations (Days 1–4)",
  "Student welcome, expectations, and activity sheets",
  "Verification logs and evidence naming guides",
  "Instructor closeout and capstone-readiness checklists",
  "Google Classroom post drafts",
  "ClickUp task batch and print queue mapping",
  "Missing-items tracking for shop prep",
  "Safety and verification culture (trace before trust)",
  "Capstone-readiness bridge and open-questions capture",
];

export default function FieldProofWeek1() {
  return (
    <PublicPageShell>
      <motion.article
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl"
      >
        <motion.p
          variants={fadeUp}
          custom={0}
          className="mb-6 text-xs font-medium uppercase tracking-widest text-indigo-600"
        >
          Field proof
        </motion.p>

        <motion.h1
          variants={fadeUp}
          custom={1}
          className="mb-4 text-4xl font-bold leading-tight tracking-tight text-[#0a0a0a] sm:text-5xl"
        >
          Turning curriculum chaos into a Week 1 operating spine
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={2}
          className="mb-16 text-lg leading-relaxed text-[#0a0a0a]/45"
        >
          A real-world curriculum planning pass showing how CANONICAL turns scattered
          planning, documents, tasks, classroom posts, and evidence routines into one
          usable teaching system.
        </motion.p>

        <Section index={3} title="The problem" icon={Route}>
          A program lead needed an upcoming youth trades / pre-apprenticeship cohort
          prepared without losing context across files, tools, lesson plans, task lists,
          print needs, and evidence requirements. The plan existed—but it was not yet
          something an instructor could run from on day one.
        </Section>

        <Section index={4} title="The CANONICAL move" icon={Layers}>
          Instead of building one more app, the work was organized into a durable
          operating spine: a planning anchor, daily ops, student activity sheets, print
          queue, task batch, and missing-items tracker. The machine room can be complex;
          the handrail stays simple.
        </Section>

        <Section index={5} title="What was created" icon={BookOpen}>
          <p className="mb-4">
            Categories only—no private packets or unpublished curriculum exposed here:
          </p>
          <ul className="space-y-2">
            {createdCategories.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-[#0a0a0a]/50">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section index={6} title="What changed">
          The work became findable, teachable, reviewable, printable later, and easier
          to hand off. Daily rhythm, verification habits, and documentation expectations
          live in one place instead of in someone&apos;s head.
        </Section>

        <Section index={7} title="Why it matters">
          The instructor no longer has to hold the whole system in memory. The structure
          becomes an external memory hook—reducing friction while preserving judgment
          and human authority. Technology should not make the user feel tested; it should
          absorb complexity, reduce shame, make the next step obvious, and leave the user
          feeling more capable than before they opened it.
        </Section>

        <Section index={8} title="The principle">
          The system carries the complexity so the user can carry your intention.
          Verification beats confidence. Documentation is part of safety—not paperwork
          theater. Hints are not proof.
        </Section>

        <motion.div
          variants={fadeUp}
          custom={9}
          className="mt-16 rounded-2xl bg-[#0a0a0a] p-8 text-white"
        >
          <p className="text-sm leading-relaxed text-white/80">
            CANONICAL is project memory, curriculum systems, and AI workflow infrastructure
            arranged into one coherent working spine. Look. We did it.
          </p>
        </motion.div>
      </motion.article>
    </PublicPageShell>
  );
}

function Section({ index, title, icon: Icon, children }) {
  return (
    <motion.section variants={fadeUp} custom={index} className="mb-14">
      <div className="mb-4 flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0a0a]/[0.03]">
            <Icon className="h-5 w-5 text-[#0a0a0a]/30" />
          </div>
        )}
        <h2 className="text-xl font-semibold tracking-tight text-[#0a0a0a]">{title}</h2>
      </div>
      <div className="text-sm leading-relaxed text-[#0a0a0a]/50 sm:pl-[52px]">{children}</div>
    </motion.section>
  );
}
