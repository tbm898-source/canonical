import React, { useState } from "react";
import { RefreshCcw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CANONICAL_CAPABILITIES } from "@/lib/canonicalCapabilities";

function unwrapResponse(response) {
  return response?.data ?? response;
}

export default function OwnerConnectorHealthCard({ ownerAccess }) {
  const [healthState, setHealthState] = useState("idle");
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  const canCheck = Boolean(ownerAccess?.liveOwnerAccess);

  async function checkHealth() {
    if (!canCheck) return;
    setHealthState("checking");
    setError("");
    try {
      const { base44 } = await import("@/api/base44Client");
      const response = await base44.functions.invoke("canonicalConnectorHealth", {});
      const result = unwrapResponse(response);
      if (!result?.success) {
        setHealthState("error");
        setError(result?.error || "Health check did not return success.");
        setHealth(null);
        return;
      }
      setHealth(result);
      setHealthState("ready");
    } catch (err) {
      setHealthState("error");
      setError(err?.message || "Network error during health check.");
      setHealth(null);
    }
  }

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
          <Shield className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-[#0a0a0a]">Connector health (read-only)</h2>
          <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/55">
            Owner-only availability check. Returns status labels only — never tokens or secrets. Demo and public
            users cannot call this endpoint from the app.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-2 sm:w-auto"
          onClick={checkHealth}
          disabled={!canCheck || healthState === "checking"}
        >
          <RefreshCcw className={`h-4 w-4 ${healthState === "checking" ? "animate-spin" : ""}`} />
          {canCheck ? (healthState === "checking" ? "Checking…" : "Check connectors") : "Owner login required"}
        </Button>
        <span className="text-xs text-[#0a0a0a]/45">
          {ownerAccess?.localPreviewAccess
            ? "Local preview bypass is active on this host only."
            : ownerAccess?.reason || "not_authenticated"}
        </span>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      {health?.connectors ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {Object.entries(health.connectors).map(([key, value]) => (
            <li key={key} className="rounded-xl border border-black/5 bg-[#fafafa] px-3 py-2 text-sm">
              <span className="font-medium text-[#0a0a0a]">
                {value?.safe_label || key}
              </span>
              <span className="mt-1 block text-xs text-[#0a0a0a]/50">
                {value?.status || "unknown"} — {value?.message || "No message"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <details className="mt-6 rounded-xl border border-black/5 bg-[#fafafa] p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/45">
          Declared backend capabilities
        </summary>
        <ul className="mt-3 space-y-2">
          {CANONICAL_CAPABILITIES.map((cap) => (
            <li key={cap.key} className="text-xs text-[#0a0a0a]/55">
              <span className="font-medium text-[#0a0a0a]/75">{cap.label}</span>
              {cap.functionName ? (
                <span className="font-mono text-[#0a0a0a]/40"> — {cap.functionName}</span>
              ) : null}
              <span className="block text-[#0a0a0a]/40">{cap.maturity}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
