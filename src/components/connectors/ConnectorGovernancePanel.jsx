import React from "react";
import { INTEGRATION_REGISTRY } from "@/lib/integrationRegistry";

function RiskBadge({ level }) {
  const palette = {
    low: "bg-emerald-50 text-emerald-800 border-emerald-100",
    medium: "bg-amber-50 text-amber-900 border-amber-100",
    high: "bg-rose-50 text-rose-800 border-rose-100",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${palette[level] || palette.medium}`}
    >
      {level}
    </span>
  );
}

export default function ConnectorGovernancePanel({ className = "" }) {
  return (
    <section className={`rounded-3xl border border-black/5 bg-white p-4 shadow-sm sm:p-6 ${className}`}>
      <h2 className="text-lg font-semibold tracking-tight text-[#0a0a0a]">Integration governance map</h2>
      <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/55">
        Read-only posture for connectors and monitors. Live writes stay in Program Helper owner mode with
        classification and approval gates.
      </p>

      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/45">
              <th className="py-2 pr-4">Integration</th>
              <th className="py-2 pr-4">State</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Read/Write</th>
              <th className="py-2 pr-4">Layer</th>
              <th className="py-2 pr-4">Risk</th>
            </tr>
          </thead>
          <tbody>
            {INTEGRATION_REGISTRY.map((row) => (
              <tr key={row.id} className="border-b border-black/5 align-top last:border-0">
                <td className="py-3 pr-4 font-medium text-[#0a0a0a]">{row.name}</td>
                <td className="py-3 pr-4 text-[#0a0a0a]/60">{row.currentState}</td>
                <td className="py-3 pr-4 text-[#0a0a0a]/60">{row.role}</td>
                <td className="py-3 pr-4 text-[#0a0a0a]/60">{row.readWrite}</td>
                <td className="py-3 pr-4 font-mono text-xs text-[#0a0a0a]/50">{row.layer}</td>
                <td className="py-3">
                  <RiskBadge level={row.privacyRisk} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-3 md:hidden">
        {INTEGRATION_REGISTRY.map((row) => (
          <article key={row.id} className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#0a0a0a]">{row.name}</h3>
              <RiskBadge level={row.privacyRisk} />
            </div>
            <p className="mt-2 text-xs leading-5 text-[#0a0a0a]/55">{row.currentState}</p>
            <p className="mt-2 text-[11px] text-[#0a0a0a]/45">
              {row.role} · {row.readWrite} · {row.layer}
            </p>
            <p className="mt-2 text-xs leading-5 text-indigo-700/80">{row.nextStep}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
