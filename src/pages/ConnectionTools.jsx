import React from "react";
import { Link } from "react-router-dom";
import { useNavModel } from "@/hooks/use-nav-model";
import LiveIntegrationsPanel from "@/components/program-helper/LiveIntegrationsPanel";

export default function ConnectionTools() {
  const { ownerAccess } = useNavModel();
  return <div className="mx-auto max-w-5xl py-4 sm:py-8">
    <h1 className="text-3xl font-bold text-slate-950">Connected services</h1>
    <p className="my-4 leading-7 text-slate-600">Connection checks and website administration are separate from reading teaching materials.</p>
    {ownerAccess.allowed ? <><LiveIntegrationsPanel owner generatedPackage={null} /><Link to="/OwnerAssistant" className="inline-flex min-h-11 items-center font-semibold text-indigo-700">Open artifact preparation & export tools</Link></> : <p className="rounded-xl bg-white p-5 text-slate-700">An administrator account is required to manage connected services. You can open teaching modules from the curriculum library.</p>}
  </div>;
}
