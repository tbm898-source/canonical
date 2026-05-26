import React from "react";
import { motion } from "framer-motion";
import { Archive, CheckCircle2, GitBranch } from "lucide-react";
import PublicPageShell from "@/components/public/PublicPageShell";
import content from "../../content/site/how-it-works.json";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HowItWorks() {
  return (
    <PublicPageShell>
      <motion.div initial="hidden" animate="visible" className="mx-auto max-w-6xl">
        <motion.header variants={fadeUp} custom={0} className="max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            {content.eyebrow}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a] sm:text-6xl">
            {content.title}
          </h1>
          <p className="mt-6 text-base leading-7 text-[#0a0a0a]/60">{content.summary}</p>
        </motion.header>

        <section className="mt-14 grid gap-3 md:grid-cols-5">
          {content.workflow.map((step, index) => (
            <motion.article
              key={step.step}
              variants={fadeUp}
              custom={index + 1}
              className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0a0a0a] text-sm font-semibold text-white">
                {index + 1}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
                {step.step}
              </div>
              <h2 className="mt-3 text-base font-semibold text-[#0a0a0a]">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/60">{step.text}</p>
            </motion.article>
          ))}
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-3xl border border-indigo-100 bg-indigo-50 p-7">
            <GitBranch className="mb-5 h-9 w-9 text-indigo-600" />
            <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
              Rails are not decoration.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#0a0a0a]/60">
              The rail model is how CANONICAL prevents useful material from becoming one haunted folder with a search bar and vibes.
            </p>
          </article>
          <div className="grid gap-3">
            {content.rails.map((rail) => (
              <div key={rail} className="flex gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <p className="text-sm leading-6 text-[#0a0a0a]/60">{rail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl bg-[#0a0a0a] p-8 text-white">
          <Archive className="mb-5 h-9 w-9 text-white/80" />
          <h2 className="text-2xl font-bold tracking-tight">Package proof is the next layer.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55">
            The CTS Master Package v1 is now the first external package converted into safe public proof metadata while keeping raw operational internals out of the public path.
          </p>
        </section>
      </motion.div>
    </PublicPageShell>
  );
}
