import React from "react";
import { Lock, ShieldAlert, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OwnerAssistantGate({ ownerAccess, onSignIn }) {
  const reason = ownerAccess?.reason ?? "not_authenticated";
  const roles = Array.isArray(ownerAccess?.roles) ? ownerAccess.roles : [];

  if (reason === "authenticated_non_owner") {
    return (
      <GateShell
        icon={ShieldAlert}
        title="Owner / admin only"
        body="You are signed in, but your account does not have the owner or admin role required to view PRISM-private program data."
        footer={
          <p className="text-xs text-[#0a0a0a]/45">
            If you believe this is wrong, contact the workspace owner. Detected roles:{" "}
            <span className="font-mono text-[#0a0a0a]/60">
              {roles.length ? roles.join(", ") : "none"}
            </span>
            .
          </p>
        }
      />
    );
  }

  if (reason === "not_authenticated") {
    return (
      <GateShell
        icon={KeyRound}
        title="Sign in required"
        body="The Owner Assistant fetches owner-private PRISM data through a server-gated function. Sign in with an authorized owner or admin account to continue."
        footer={
          onSignIn ? (
            <Button onClick={onSignIn} className="bg-[#0a0a0a] text-white hover:bg-[#0a0a0a]/90">
              Sign in
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <GateShell
      icon={Lock}
      title="Access blocked"
      body="The Owner Assistant cannot be rendered for this session. This page does not honor local-preview bypass; real owner or admin authentication is required."
      footer={
        <p className="text-xs text-[#0a0a0a]/45">
          Reason: <span className="font-mono text-[#0a0a0a]/60">{reason}</span>.
        </p>
      }
    />
  );
}

function GateShell({ icon: Icon, title, body, footer }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a0a0a]/5">
        <Icon className="h-6 w-6 text-[#0a0a0a]/60" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#0a0a0a]">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#0a0a0a]/60">{body}</p>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </main>
  );
}
