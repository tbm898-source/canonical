import React from "react";

// Truthful capability labels per docs/CANONICAL_Agent_Council_Flow_v0_1.md section 6.
// Keep this list aligned with that doc. Unknown labels render as a neutral fallback
// so accidental typos do not silently render an "official-looking" tag.
const CAPABILITY_LABELS = {
  "Demo only": "bg-slate-50 text-slate-700 border-slate-200",
  "Owner available": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Dry-run available": "bg-amber-50 text-amber-800 border-amber-200",
  "Live write enabled": "bg-blue-50 text-blue-700 border-blue-200",
  "Backend declared": "bg-slate-50 text-slate-600 border-slate-200",
  "Backend wired": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Not implemented": "bg-zinc-50 text-zinc-600 border-zinc-200",
  "Needs seeding": "bg-orange-50 text-orange-700 border-orange-200",
  "Needs owner auth": "bg-rose-50 text-rose-700 border-rose-200",
  "Blocked by config": "bg-rose-50 text-rose-700 border-rose-200",
  "Blocked by publish": "bg-rose-50 text-rose-700 border-rose-200",
  Unknown: "bg-zinc-50 text-zinc-600 border-zinc-200",
};

export default function CapabilityBadge({ label, className = "" }) {
  const normalizedLabel = typeof label === "string" ? label : "Unknown";
  const tone =
    CAPABILITY_LABELS[normalizedLabel] || CAPABILITY_LABELS.Unknown;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-tight ${tone} ${className}`.trim()}
      title={`Capability label: ${normalizedLabel}`}
    >
      {normalizedLabel}
    </span>
  );
}

export const CAPABILITY_LABEL_VALUES = Object.freeze(Object.keys(CAPABILITY_LABELS));
