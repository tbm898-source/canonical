import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, FileArchive, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicPageShell from "@/components/public/PublicPageShell";
import content from "../../content/site/proof.json";
import packageSummary from "../../content/packages/generated/cts-master-package-v1.summary.json";
import packageComponents from "../../content/packages/generated/cts-master-package-v1.components.json";
import authorityMap from "../../content/packages/generated/cts-master-package-v1.authority-map.json";

const statCards = [
  { label: "Top-level files", value: packageSummary.totals.top_level_file_count },
  { label: "Matrix rows", value: packageSummary.totals.matrix_rows },
  { label: "Nested archives", value: packageSummary.totals.nested_archive_count },
  { label: "Source packages mapped", value: packageSummary.totals.referenced_source_zip_count },
];

export default function Proof() {
  return (
    <PublicPageShell>
      <div className="mx-auto max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            {content.eyebrow}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a] sm:text-6xl">
            {content.title}
          </h1>
          <p className="mt-6 text-base leading-7 text-[#0a0a0a]/60">{content.summary}</p>
        </motion.header>

        <section className="mt-12 grid gap-3 md:grid-cols-3">
          {content.proof_cards.map((card) => (
            <article key={card.label} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
              <ShieldCheck className="mb-5 h-8 w-8 text-indigo-600" />
              <h2 className="text-base font-semibold text-[#0a0a0a]">{card.label}</h2>
              <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/60">{card.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <FileArchive className="mb-5 h-9 w-9 text-indigo-600" />
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
                First proof package
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">
                {packageSummary.title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#0a0a0a]/60">{packageSummary.purpose}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {packageSummary.scope}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  {packageSummary.public_exposure}
                </span>
                <span className="rounded-full bg-[#fafafa] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
                  SHA256 verified
                </span>
              </div>
            </div>
            <Link to="/Packages/cts-master-package-v1">
              <Button className="gap-2 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]">
                View Package Detail
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-[#fafafa] p-5">
                <div className="text-2xl font-bold text-[#0a0a0a]">{stat.value}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/40">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-[#0a0a0a]">Component proof</h2>
            <div className="mt-5 grid gap-3">
              {packageComponents.top_level_components.slice(0, 6).map((component) => (
                <div key={component.name} className="rounded-2xl bg-[#fafafa] p-4">
                  <h3 className="text-sm font-semibold text-[#0a0a0a]">{component.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/60">{component.public_purpose}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-[#0a0a0a]">Authority summary</h2>
            <div className="mt-5 grid gap-3">
              {authorityMap.authority_counts.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-4 rounded-2xl bg-[#fafafa] p-4">
                  <span className="text-sm font-medium text-[#0a0a0a]">{item.name}</span>
                  <span className="text-sm font-bold text-indigo-600">{item.count}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </PublicPageShell>
  );
}
