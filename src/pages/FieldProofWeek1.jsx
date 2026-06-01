import React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Layers,
  Route,
  ShieldCheck,
  Table2,
} from "lucide-react";
import PublicPageShell from "@/components/public/PublicPageShell";
import content from "@/content/site/field-proof-week1.json";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const { sections: s } = content;

export default function FieldProofWeek1() {
  return (
    <PublicPageShell>
      <motion.article initial="hidden" animate="visible" className="mx-auto max-w-4xl">
        <motion.p
          variants={fadeUp}
          custom={0}
          className="mb-6 text-xs font-medium uppercase tracking-widest text-indigo-600"
        >
          {content.eyebrow}
        </motion.p>

        <motion.h1
          variants={fadeUp}
          custom={1}
          className="mb-4 text-4xl font-bold leading-tight tracking-tight text-[#0a0a0a] sm:text-5xl"
        >
          {content.title}
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={2}
          className="mb-10 text-lg leading-relaxed text-[#0a0a0a]/45"
        >
          {content.subtitle}
        </motion.p>

        <motion.section
          variants={fadeUp}
          custom={3}
          className="mb-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {content.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <div className="text-3xl font-bold tracking-tight text-[#0a0a0a]">{stat.value}</div>
              <div className="mt-1 text-xs leading-5 text-[#0a0a0a]/50">{stat.label}</div>
            </div>
          ))}
        </motion.section>

        <Section index={4} title={s.problem.title} icon={Route}>
          <p>{s.problem.body}</p>
        </Section>

        <Section index={5} title={s.canonicalMove.title} icon={Layers}>
          <p>{s.canonicalMove.body}</p>
        </Section>

        <Section index={6} title={s.cohortContext.title} icon={CalendarDays}>
          <BulletList items={s.cohortContext.items} />
        </Section>

        <Section index={7} title={s.weekPurpose.title} icon={ShieldCheck}>
          <p>{s.weekPurpose.body}</p>
        </Section>

        <Section index={8} title={s.studentOutcomes.title} icon={Table2}>
          <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-[#fafafa]">
                  <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Outcome</th>
                  <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {s.studentOutcomes.rows.map((row) => (
                  <tr key={row.outcome} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 text-[#0a0a0a]/70">{row.outcome}</td>
                    <td className="px-4 py-3 text-[#0a0a0a]/50">{row.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section index={9} title={s.dailyRhythm.title} icon={CalendarDays}>
          <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-[#fafafa]">
                  <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Block</th>
                  <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Timing</th>
                  <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Activity</th>
                </tr>
              </thead>
              <tbody>
                {s.dailyRhythm.rows.map((row) => (
                  <tr key={row.block} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-[#0a0a0a]/70">{row.block}</td>
                    <td className="px-4 py-3 text-[#0a0a0a]/45">{row.time}</td>
                    <td className="px-4 py-3 text-[#0a0a0a]/50">{row.activity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section index={10} title={s.dayByDay.title} icon={ClipboardList}>
          <div className="space-y-4">
            {s.dayByDay.days.map((day) => (
              <div
                key={day.day}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-semibold text-[#0a0a0a]">{day.day}</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="font-medium text-[#0a0a0a]/55">Focus</dt>
                    <dd className="mt-0.5 leading-relaxed text-[#0a0a0a]/50">{day.focus}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[#0a0a0a]/55">Mastery checks</dt>
                    <dd className="mt-0.5 text-[#0a0a0a]/50">{day.mastery}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[#0a0a0a]/55">Instructor run sheet</dt>
                    <dd className="mt-0.5 leading-relaxed text-[#0a0a0a]/50">
                      {day.instructorSheet}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </Section>

        <Section index={11} title={s.operatingSpine.title} icon={Layers}>
          <div className="space-y-3">
            {s.operatingSpine.layers.map((layer) => (
              <div
                key={layer.name}
                className="rounded-xl border border-black/5 bg-white px-4 py-3"
              >
                <div className="text-sm font-semibold text-[#0a0a0a]">{layer.name}</div>
                <p className="mt-1 text-sm leading-relaxed text-[#0a0a0a]/50">{layer.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section index={12} title={s.planningDocs.title} icon={BookOpen}>
          <DocGroups groups={s.planningDocs.groups} />
        </Section>

        <Section index={13} title={s.activitySheets.title} icon={ClipboardList}>
          <DocGroups groups={s.activitySheets.groups} />
        </Section>

        <Section index={14} title={s.evidenceSystem.title} icon={ShieldCheck}>
          <p className="mb-4">{s.evidenceSystem.body}</p>
          <div className="mb-4 rounded-xl bg-[#0a0a0a] px-4 py-3 font-mono text-xs text-white/90">
            {s.evidenceSystem.namingPattern}
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/40">
            Naming notes
          </p>
          <BulletList items={s.evidenceSystem.namingNotes} className="mb-6" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/40">
            Verification principles
          </p>
          <BulletList items={s.evidenceSystem.verificationPrinciples} />
        </Section>

        <Section index={15} title={s.workflow.title} icon={Route}>
          <div className="space-y-5">
            {s.workflow.phases.map((phase) => (
              <div key={phase.label}>
                <h3 className="text-sm font-semibold text-[#0a0a0a]">{phase.label}</h3>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-[#0a0a0a]/50">
                  {phase.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Section>

        <Section index={16} title={s.whatChanged.title}>
          <p>{s.whatChanged.body}</p>
        </Section>

        <Section index={17} title={s.whyItMatters.title}>
          <p>{s.whyItMatters.body}</p>
        </Section>

        <Section index={18} title={s.principle.title}>
          <p>{s.principle.body}</p>
        </Section>

        <motion.div
          variants={fadeUp}
          custom={19}
          className="mt-16 rounded-2xl bg-[#0a0a0a] p-8 text-white"
        >
          <p className="text-sm leading-relaxed text-white/80">{s.closing}</p>
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

function BulletList({ items, className = "" }) {
  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-[#0a0a0a]/50">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DocGroups({ groups }) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 text-sm font-semibold text-[#0a0a0a]/70">{group.label}</h3>
          <BulletList items={group.items} />
        </div>
      ))}
    </div>
  );
}
