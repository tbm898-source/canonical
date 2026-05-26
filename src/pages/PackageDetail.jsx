import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileArchive, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicPageShell from "@/components/public/PublicPageShell";
import packageIndex from "../../content/packages/index.json";
import ctsSummary from "../../content/packages/generated/cts-master-package-v1.summary.json";
import ctsComponents from "../../content/packages/generated/cts-master-package-v1.components.json";
import ctsManifest from "../../content/packages/generated/cts-master-package-v1.manifest.json";
import ctsAuthorityMap from "../../content/packages/generated/cts-master-package-v1.authority-map.json";
import slideSummary from "../../content/packages/generated/cts-rcs-10week-slide-templates.summary.json";
import slideComponents from "../../content/packages/generated/cts-rcs-10week-slide-templates.components.json";
import slideManifest from "../../content/packages/generated/cts-rcs-10week-slide-templates.manifest.json";
import slideAuthorityMap from "../../content/packages/generated/cts-rcs-10week-slide-templates.authority-map.json";

const packageRegistry = {
  "cts-master-package-v1": {
    summary: ctsSummary,
    components: ctsComponents,
    manifest: ctsManifest,
    authorityMap: ctsAuthorityMap,
  },
  "cts-rcs-10week-slide-templates": {
    summary: slideSummary,
    components: slideComponents,
    manifest: slideManifest,
    authorityMap: slideAuthorityMap,
  },
};

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function PackageDetail() {
  const { packageId } = useParams();
  const packageRecord = packageRegistry[packageId];
  const listed = packageIndex.packages.find((item) => item.package_id === packageId);

  if (!packageRecord || !listed) {
    return (
      <PublicPageShell>
        <div className="mx-auto max-w-3xl rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">Package not found</h1>
          <p className="mt-4 text-sm leading-6 text-[#0a0a0a]/60">
            The requested package is not registered in the public proof layer.
          </p>
          <Link to="/Proof">
            <Button className="mt-6 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]">
              Back to Proof
            </Button>
          </Link>
        </div>
      </PublicPageShell>
    );
  }

  const { summary, components, manifest, authorityMap } = packageRecord;
  const { source_package: sourcePackage, public_safety: publicSafety } = summary;
  const deckIndex = Array.isArray(summary.deck_index) ? summary.deck_index : [];

  return (
    <PublicPageShell>
      <div className="mx-auto max-w-6xl">
        <Link to="/Proof" className="mb-8 inline-flex items-center gap-2 text-sm text-[#0a0a0a]/55 hover:text-[#0a0a0a]">
          <ArrowLeft className="h-4 w-4" />
          Back to Proof
        </Link>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <header className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
            <FileArchive className="mb-5 h-10 w-10 text-indigo-600" />
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Sanitized package detail
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a] sm:text-5xl">
              {summary.title}
            </h1>
            <p className="mt-6 text-base leading-7 text-[#0a0a0a]/60">{summary.purpose}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#fafafa] p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/40">
                  Scope
                </div>
                <div className="mt-2 text-sm font-semibold text-[#0a0a0a]">{summary.scope}</div>
              </div>
              <div className="rounded-2xl bg-[#fafafa] p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/40">
                  Public layer
                </div>
                <div className="mt-2 text-sm font-semibold text-[#0a0a0a]">{summary.public_exposure}</div>
              </div>
              <div className="rounded-2xl bg-[#fafafa] p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/40">
                  Hash
                </div>
                <div className="mt-2 text-sm font-semibold text-[#0a0a0a]">
                  {sourcePackage.sha256_matches_expected ? "Verified" : "Mismatch"}
                </div>
              </div>
            </div>
          </header>

          <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
            <ShieldCheck className="mb-5 h-9 w-9 text-amber-700" />
            <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">Privacy posture</h2>
            <p className="mt-4 text-sm leading-6 text-[#0a0a0a]/65">
              This page proves the package exists and shows safe structure only. Raw operational templates, restricted field internals, local paths, and live connector behavior stay outside public/demo routes.
            </p>
            <div className="mt-5 rounded-2xl bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/40">
                Source ZIP
              </div>
              <div className="mt-2 break-words text-sm font-semibold text-[#0a0a0a]">
                {sourcePackage.file_name}
              </div>
              <div className="mt-2 break-all text-xs leading-5 text-[#0a0a0a]/50">
                SHA256: {sourcePackage.sha256}
              </div>
            </div>
          </aside>
        </section>

        {deckIndex.length > 0 && (
          <section className="mt-8 rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
                  Slide template spine
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-[#0a0a0a]">
                  Weekly deck index
                </h2>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                Direct PPTX editing disabled until fidelity gate
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {deckIndex.map((deck) => (
                <div key={deck.file_name} className="rounded-2xl bg-[#fafafa] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    {deck.week_label}
                  </div>
                  <div className="mt-2 break-words text-sm font-semibold text-[#0a0a0a]">
                    {deck.file_name}
                  </div>
                  <div className="mt-3 text-xs leading-5 text-[#0a0a0a]/50">
                    {deck.slide_count} slides / {deck.layout_count} layout / {deck.media_count} media
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(summary.totals).map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-2xl font-bold text-[#0a0a0a]">{value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/40">
                {label.replace(/_/g, " ")}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-[#0a0a0a]">Package components</h2>
            <div className="mt-5 grid gap-3">
              {components.top_level_components.map((component) => (
                <div key={component.name} className="rounded-2xl bg-[#fafafa] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#0a0a0a]">{component.name}</h3>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/40">
                      {formatBytes(component.size_bytes)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/60">{component.public_purpose}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-[#0a0a0a]">Authority map</h2>
            <div className="mt-5 grid gap-3">
              {authorityMap.authority_counts.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-4 rounded-2xl bg-[#fafafa] p-4">
                  <span className="text-sm font-medium text-[#0a0a0a]">{item.name}</span>
                  <span className="text-sm font-bold text-indigo-600">{item.count}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-[#0a0a0a]">System relevance</h2>
            <div className="mt-5 grid gap-3">
              {components.source_systems.map((system) => (
                <div key={system.label} className="rounded-2xl bg-[#fafafa] p-4">
                  <h3 className="text-sm font-semibold text-[#0a0a0a]">{system.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/60">{system.posture}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-[#0a0a0a]">Public safety rules</h2>
            <div className="mt-5 grid gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[#0a0a0a]">May show</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#0a0a0a]/60">
                  {publicSafety.public_may_show.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0a0a0a]">Must not show</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#0a0a0a]/60">
                  {publicSafety.public_must_not_show.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-3xl bg-[#0a0a0a] p-8 text-white">
          <h2 className="text-2xl font-bold tracking-tight">Generated proof manifest</h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55">
            Parser output confirms the raw ZIP was not committed. Generated site artifacts include sanitized summary, component list, manifest, authority map, markdown summary, and deck index when applicable.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(manifest.entry_counts).slice(0, 4).map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/10 p-4">
                <div className="text-xl font-bold">{value}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-white/45">{label.replace(/_/g, " ")}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
