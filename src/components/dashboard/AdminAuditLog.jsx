import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getOwnerAccessState } from "@/lib/ownerAccessPolicy";
import { Shield, RefreshCcw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function Row({ label, value, highlight }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 border-b border-black/5 py-3 text-sm last:border-0 ${highlight ? "bg-amber-50 -mx-4 px-4 rounded-xl" : ""}`}>
      <span className="font-medium text-[#0a0a0a]/60">{label}</span>
      <span className="text-right font-mono text-xs text-[#0a0a0a] break-all max-w-xs">{String(value ?? "—")}</span>
    </div>
  );
}

function StatusBadge({ ok, label }) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
      <XCircle className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

export default function AdminAuditLog() {
  const { user, isAuthenticated, checkAppState } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [liveUser, setLiveUser] = useState(null);
  const [liveUserError, setLiveUserError] = useState(null);
  const [loading, setLoading] = useState(false);

  const ownerAccess = getOwnerAccessState({ user, isAuthenticated });

  const fetchLiveUser = async () => {
    setLoading(true);
    setLiveUserError(null);
    try {
      const { base44 } = await import("@/api/base44Client");
      const me = await base44.auth.me();
      setLiveUser(me);
    } catch (err) {
      setLiveUserError(err?.message || "Failed to fetch live user from SDK.");
      setLiveUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveUser();
  }, [refreshKey]);

  const handleRefresh = async () => {
    await checkAppState();
    setRefreshKey((k) => k + 1);
  };

  const rawRole = liveUser?.role ?? user?.role;
  const rawAppUserRole = user?.app_user_role;
  const rawPortalRole = user?.portal_role;
  const rawMetaRole = user?.metadata?.app_user_role;

  const adminFromRole = rawRole === "admin";
  const ownerFromRole = rawRole === "owner";
  const workbenchAllowed = ownerAccess.allowed;

  return (
    <section className="mt-10 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <Shield className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
              Admin Audit Log
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-[#0a0a0a]">
              Your current permissions &amp; access state
            </h2>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={handleRefresh} disabled={loading}>
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Overall status */}
      <div className="mb-6 flex flex-wrap gap-3">
        <StatusBadge ok={isAuthenticated} label={isAuthenticated ? "Authenticated" : "Not authenticated"} />
        <StatusBadge ok={adminFromRole || ownerFromRole} label={adminFromRole ? "admin role" : ownerFromRole ? "owner role" : `role: ${rawRole ?? "none"}`} />
        <StatusBadge ok={workbenchAllowed} label={workbenchAllowed ? "Workbench: ALLOWED" : "Workbench: BLOCKED"} />
      </div>

      {/* Auth context user object */}
      <div className="mb-4 rounded-2xl border border-black/5 bg-[#fafafa] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
          AuthContext user fields
        </p>
        <Row label="isAuthenticated" value={String(isAuthenticated)} />
        <Row label="user.email" value={user?.email} />
        <Row label="user.id" value={user?.id} />
        <Row label="user.role" value={rawRole} highlight={!adminFromRole && !ownerFromRole} />
        <Row label="user.app_user_role" value={rawAppUserRole} />
        <Row label="user.portal_role" value={rawPortalRole} />
        <Row label="user.metadata.app_user_role" value={rawMetaRole} />
        <Row label="user.full_name" value={user?.full_name} />
      </div>

      {/* Live SDK fetch */}
      <div className="mb-4 rounded-2xl border border-black/5 bg-[#fafafa] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
          Live SDK base44.auth.me() result
        </p>
        {liveUserError ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {liveUserError}
          </div>
        ) : liveUser ? (
          <>
            <Row label="id" value={liveUser.id} />
            <Row label="email" value={liveUser.email} />
            <Row label="role" value={liveUser.role} highlight={liveUser.role !== "admin" && liveUser.role !== "owner"} />
            <Row label="full_name" value={liveUser.full_name} />
            <Row label="created_date" value={liveUser.created_date} />
          </>
        ) : (
          <p className="text-sm text-[#0a0a0a]/40">{loading ? "Loading..." : "No data."}</p>
        )}
      </div>

      {/* Owner access policy evaluation */}
      <div className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
          Owner access policy evaluation
        </p>
        <Row label="allowed" value={String(ownerAccess.allowed)} highlight={!ownerAccess.allowed} />
        <Row label="liveOwnerAccess" value={String(ownerAccess.liveOwnerAccess)} />
        <Row label="reason" value={ownerAccess.reason} />
        <Row label="roleSource" value={ownerAccess.roleSource} />
        <Row label="roles[]" value={ownerAccess.roles.length ? ownerAccess.roles.join(", ") : "empty"} highlight={!ownerAccess.roles.length} />
      </div>

      {!workbenchAllowed && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold mb-1">Why workbench is blocked</div>
          <p>
            Reason: <span className="font-mono font-semibold">{ownerAccess.reason}</span>.{" "}
            {ownerAccess.reason === "not_authenticated"
              ? "You are not signed in. Log in with an admin account to unlock the owner workbench."
              : ownerAccess.reason === "insufficient_role"
              ? `Your account role is "${rawRole ?? "none"}". The workbench requires role = "admin" or "owner". Ask the app owner to update your role in the Base44 dashboard.`
              : "Check the fields above to identify the mismatch."}
          </p>
        </div>
      )}
    </section>
  );
}