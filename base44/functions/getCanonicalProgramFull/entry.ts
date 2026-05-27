// Inlined helpers from base44/functions/_shared/canonicalPolicy.ts.
// Base44 deploy on this app cannot resolve relative ../_shared/ imports
// (see canary2 isolation experiment 2026-05-27). Source-of-truth for owner
// policy logic remains _shared/canonicalPolicy.ts; this is a duplicated
// subset required for runtime. Keep in sync manually.
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

function getRecordList(response: unknown) {
  if (Array.isArray(response)) return response;
  const data = (response as { data?: unknown })?.data;
  if (Array.isArray(data)) return data;
  const items = (response as { items?: unknown })?.items;
  if (Array.isArray(items)) return items;
  const records = (response as { records?: unknown })?.records;
  if (Array.isArray(records)) return records;
  return [];
}

function emptyPayload(extra: Record<string, unknown> = {}) {
  return {
    success: false,
    program: null,
    modules: [],
    artifacts: [],
    warnings: [] as string[],
    timestamp: nowIso(),
    error: null as string | null,
    ...extra,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    try {
      await requireOwnerAdmin(base44);
    } catch (error) {
      return Response.json(
        emptyPayload({ error: safeErrorMessage(error) }),
        { status: 403 },
      );
    }

    const payload = await req.json().catch(() => ({}));
    const programKey = String(
      (payload as { program_key?: unknown })?.program_key || "",
    ).trim();

    if (!programKey) {
      return Response.json(
        emptyPayload({ error: "program_key is required." }),
        { status: 200 },
      );
    }

    const programResponse =
      await base44.asServiceRole.entities.CanonicalProgram.filter(
        { program_key: programKey },
        "-updated_at",
        1,
      );
    const program = getRecordList(programResponse)[0] || null;

    if (!program) {
      return Response.json(
        {
          success: true,
          program: null,
          modules: [],
          artifacts: [],
          warnings: [
            `No CanonicalProgram record found for program_key="${programKey}". Owner can seed by invoking seedPrismDtjlFromBundle (PRISM_DTJL only) or by inserting records via the Base44 console.`,
          ],
          timestamp: nowIso(),
          error: null,
        },
        { status: 200 },
      );
    }

    const modulesResponse =
      await base44.asServiceRole.entities.CanonicalModule.filter(
        { program_key: programKey },
        "-updated_at",
        200,
      );
    const modules = getRecordList(modulesResponse);

    const artifacts: unknown[] = [];
    const artifactWarnings: string[] = [];
    for (const mod of modules as Array<{ module_key?: string }>) {
      if (!mod?.module_key) continue;
      try {
        const artifactResponse =
          await base44.asServiceRole.entities.CanonicalGeneratedArtifact.filter(
            { module_key: mod.module_key },
            "-updated_at",
            100,
          );
        for (const artifact of getRecordList(artifactResponse)) {
          artifacts.push(artifact);
        }
      } catch (error) {
        artifactWarnings.push(
          `Could not load artifacts for module_key="${mod.module_key}": ${safeErrorMessage(error)}`,
        );
      }
    }

    return Response.json(
      {
        success: true,
        program,
        modules,
        artifacts,
        warnings: artifactWarnings,
        timestamp: nowIso(),
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      emptyPayload({ error: safeErrorMessage(error) }),
      { status: 200 },
    );
  }
});
