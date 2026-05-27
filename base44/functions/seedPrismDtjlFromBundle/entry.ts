// Owner-only stub: PRISM_DTJL seeding is a no-op on this Base44 plan.
//
// Background: this app's plan does not expose the Backend Platform entity
// API (`npx base44 entities push` is blocked, and the dashboard does not
// expose a Functions UI). Until the entity layer is provisioned, the
// PRISM_DTJL data lives inline server-side inside getCanonicalProgramFull.
// Therefore there is nothing to seed.
//
// The original entity-writing seed logic is preserved in git history (see
// commit d290661 and the pre-2026-05-27 versions of this file) and can be
// restored when the entity API becomes available.
//
// Inlined policy helpers below (Base44 deploy cannot resolve ../_shared/
// imports on this app; see canary2 isolation experiment 2026-05-27).
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function nowIso() {
  return new Date().toISOString();
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    if (/token|secret|authorization|oauth|bearer/i.test(error.message)) {
      return "Connector request failed without exposing credentials.";
    }
    return error.message.slice(0, 240);
  }
  return "Unknown connector error.";
}

const OWNER_ROLES = new Set(["admin", "owner"]);

function rolesRecordList(response: any) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.records)) return response.records;
  return [];
}

function collectRoles(value: unknown, key = "", roles: string[] = []) {
  const roleKeys = new Set([
    "role",
    "roles",
    "portal_role",
    "app_role",
    "app_roles",
    "app_user_role",
    "user_role",
    "permissions",
  ]);
  const ownerFlagKeys = new Set(["is_admin", "admin", "isOwner", "is_owner"]);

  if (value == null) return roles;
  if (typeof value === "boolean" && ownerFlagKeys.has(key) && value) {
    roles.push("admin");
    return roles;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    if (roleKeys.has(key)) roles.push(String(value));
    return roles;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectRoles(item, key, roles));
    return roles;
  }
  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([nextKey, nextValue]) =>
      collectRoles(nextValue, nextKey, roles),
    );
  }
  return roles;
}

async function requireOwnerAdmin(base44: any) {
  const currentUser = await base44.auth.me();
  const email = String(currentUser?.email || "").toLowerCase();
  const roleSources: unknown[] = [currentUser];

  if (email) {
    try {
      const matchingUsers = await base44.asServiceRole.entities.User.filter(
        { email },
        "-updated_date",
        5,
      );
      const appUser =
        rolesRecordList(matchingUsers).find(
          (record: Record<string, unknown>) =>
            String(record?.email || "").toLowerCase() === email,
        ) || rolesRecordList(matchingUsers)[0];
      if (appUser) roleSources.push(appUser);
    } catch (_error) {
      // role enrichment is best-effort
    }
  }

  const roles = roleSources
    .flatMap((source) => collectRoles(source))
    .map((role) => role.toLowerCase());
  if (!roles.some((role) => OWNER_ROLES.has(role))) {
    throw new Error("Owner/admin role required for this backend action.");
  }

  return { email, roles: [...new Set(roles)] };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    try {
      await requireOwnerAdmin(base44);
    } catch (error) {
      return Response.json(
        {
          success: false,
          seeded: { program: null, modules: [], artifacts: [] },
          timestamp: nowIso(),
          error: safeErrorMessage(error),
        },
        { status: 403 },
      );
    }

    return Response.json(
      {
        success: true,
        seeded: { program: null, modules: [], artifacts: [] },
        skipped: true,
        skipped_reason:
          "Entity layer is not provisioned on this Base44 plan. PRISM_DTJL data is served inline by getCanonicalProgramFull and does not require seeding. Restore the entity-writing seed logic from git history (commit d290661) when the entity API becomes available.",
        timestamp: nowIso(),
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        seeded: { program: null, modules: [], artifacts: [] },
        timestamp: nowIso(),
        error: safeErrorMessage(error),
      },
      { status: 200 },
    );
  }
});
