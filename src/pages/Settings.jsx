import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Lock, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicPageShell from "@/components/public/PublicPageShell";
import ConnectorGovernancePanel from "@/components/connectors/ConnectorGovernancePanel";
import OwnerConnectorHealthCard from "@/components/connectors/OwnerConnectorHealthCard";
import { useAuth } from "@/lib/AuthContext";
import { getOwnerAccessState } from "@/lib/ownerAccessPolicy";
import { getEndpointPulseUrl } from "@/lib/integrationRegistry";

function RoleCard({ ownerAccess, user, isAuthenticated }) {
  const modeLabel = ownerAccess.liveOwnerAccess
    ? "Owner / admin (live)"
    : ownerAccess.localPreviewAccess
      ? "Local preview bypass"
      : isAuthenticated
        ? "Signed in (non-owner)"
        : "Public / demo";

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0a0a0a]">
          <Settings2 className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-[#0a0a0a]">Session & role</h2>
          <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/55">
            Owner mode requires verified Base44 auth and an owner/admin role (or configured allowlist). Query
            strings alone do not unlock private PRISM data.
          </p>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-[#fafafa] p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/40">Mode</dt>
          <dd className="mt-1 font-medium text-[#0a0a0a]">{modeLabel}</dd>
        </div>
        <div className="rounded-xl bg-[#fafafa] p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/40">Email</dt>
          <dd className="mt-1 break-all font-mono text-xs text-[#0a0a0a]/70">
            {user?.email || "Not signed in"}
          </dd>
        </div>
        <div className="rounded-xl bg-[#fafafa] p-3 sm:col-span-2">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/40">Access reason</dt>
          <dd className="mt-1 font-mono text-xs text-[#0a0a0a]/70">{ownerAccess.reason}</dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link to="/ProgramHelper?mode=demo" className="w-full sm:w-auto">
          <Button variant="outline" className="h-11 w-full rounded-xl">
            Open demo viewer
          </Button>
        </Link>
        {ownerAccess.allowed ? (
          <Link to="/ProgramHelper?mode=owner" className="w-full sm:w-auto">
            <Button className="h-11 w-full rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]">
              Open owner workbench
            </Button>
          </Link>
        ) : (
          <Link to="/OwnerAssistant" className="w-full sm:w-auto">
            <Button variant="outline" className="h-11 w-full gap-2 rounded-xl">
              <Lock className="h-4 w-4" />
              Owner Assistant
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}

function ExternalMonitorsCard() {
  const pulseUrl = getEndpointPulseUrl();

  return (
    <section className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-[#0a0a0a]">External monitors</h2>
      <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/55">
        Endpoint Pulse and FieldPulse stay separate from this app. Link out only; do not embed operator tools
        in the public bundle.
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        <li className="rounded-2xl border border-white/80 bg-white p-4">
          <div className="font-medium text-[#0a0a0a]">Endpoint Pulse</div>
          <p className="mt-1 text-[#0a0a0a]/55">Monitors CANONICAL / Base44 endpoints.</p>
          {pulseUrl ? (
            <a
              href={pulseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Open Endpoint Pulse
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <p className="mt-2 text-xs text-[#0a0a0a]/45">
              Declared only. Set <span className="font-mono">VITE_ENDPOINT_PULSE_URL</span> in the app env to
              enable the link.
            </p>
          )}
        </li>
        <li className="rounded-2xl border border-white/80 bg-white p-4">
          <div className="font-medium text-[#0a0a0a]">FieldPulse</div>
          <p className="mt-1 text-[#0a0a0a]/55">Separate product — not merged into CANONICAL Program OS.</p>
        </li>
      </ul>
    </section>
  );
}

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const ownerAccess = useMemo(
    () => getOwnerAccessState({ user, isAuthenticated }),
    [isAuthenticated, user],
  );

  return (
    <PublicPageShell>
      <div className="mx-auto max-w-4xl">
        <header className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">Settings</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a] sm:text-4xl">
            Operator settings & connector posture
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#0a0a0a]/60">
            Read-first integration map and owner health checks. Live Dropbox saves and adapter writes remain in
            Program Helper with explicit approval.
          </p>
        </header>

        <div className="mt-10 space-y-8">
          <RoleCard ownerAccess={ownerAccess} user={user} isAuthenticated={isAuthenticated} />
          <ExternalMonitorsCard />
          <OwnerConnectorHealthCard ownerAccess={ownerAccess} />
          <ConnectorGovernancePanel />
          <p className="text-center text-xs text-[#0a0a0a]/40">
            <Link to="/Integrations" className="text-indigo-600 hover:text-indigo-800">
              Connector overview
            </Link>
            {" · "}
            <Link to="/Docs" className="text-indigo-600 hover:text-indigo-800">
              Documentation
            </Link>
          </p>
        </div>
      </div>
    </PublicPageShell>
  );
}
