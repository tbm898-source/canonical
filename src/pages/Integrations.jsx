import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicPageShell from "@/components/public/PublicPageShell";
import ConnectorGovernancePanel from "@/components/connectors/ConnectorGovernancePanel";
import { useAuth } from "@/lib/AuthContext";
import { getOwnerAccessState } from "@/lib/ownerAccessPolicy";
import content from "@content/site/integrations.json";

export default function Integrations() {
  const { user, isAuthenticated } = useAuth();
  const ownerAccess = useMemo(
    () => getOwnerAccessState({ user, isAuthenticated }),
    [isAuthenticated, user],
  );

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

        <section className="mt-14 grid gap-3 md:grid-cols-2">
          {content.connectors.map((connector) => (
            <article key={connector.name} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
              <PlugZap className="mb-5 h-8 w-8 text-indigo-600" />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#0a0a0a]">{connector.name}</h2>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {connector.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#0a0a0a]/60">{connector.posture}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-3xl border border-indigo-100 bg-indigo-50 p-7">
          <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">Connector rules</h2>
          <div className="mt-5 grid gap-3">
            {content.rules.map((rule) => (
              <div key={rule} className="flex gap-3 rounded-2xl bg-white p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <p className="text-sm leading-6 text-[#0a0a0a]/60">{rule}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-[#0a0a0a]">Live controls</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#0a0a0a]/60">
            Connector health, Dropbox discovery, and packet saves run in the owner workbench — not from demo
            mode. Settings shows read-only posture and an optional Endpoint Pulse link.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link to="/Settings" className="w-full sm:w-auto">
              <Button variant="outline" className="h-11 w-full rounded-xl">
                Settings & health check
              </Button>
            </Link>
            <Link
              to={ownerAccess.allowed ? "/ProgramHelper?mode=owner#integrations" : "/ProgramHelper?mode=demo"}
              className="w-full sm:w-auto"
            >
              <Button className="h-11 w-full gap-2 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]">
                {ownerAccess.allowed ? "Owner integrations panel" : "Demo workbench"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <ConnectorGovernancePanel className="mt-12" />
      </div>
    </PublicPageShell>
  );
}