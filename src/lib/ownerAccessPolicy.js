export const OWNER_MODE_ALIASES = new Set(["owner", "admin"]);
export const OWNER_ROLES = new Set(["admin", "owner"]);

const ownerFlagKeys = new Set(["is_admin", "admin", "isOwner", "is_owner"]);
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

export function isLocalPreviewHost(hostname = globalThis.window?.location?.hostname || "") {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

function configuredOwnerEmails() {
  return String(import.meta.env.VITE_CANONICAL_OWNER_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function collectUserRoles(user) {
  const roles = [];
  const collectRoles = (value, key = "") => {
    if (value == null) return;
    if (typeof value === "boolean" && ownerFlagKeys.has(key) && value) {
      roles.push("admin");
      return;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      if (roleKeys.has(key)) roles.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => collectRoles(item, key));
      return;
    }
    if (typeof value === "object") {
      Object.entries(value).forEach(([nextKey, nextValue]) => collectRoles(nextValue, nextKey));
    }
  };

  collectRoles(user);
  return [...new Set(roles.map((role) => String(role || "").toLowerCase()).filter(Boolean))];
}

export function getOwnerAccessState({
  user,
  isAuthenticated = false,
  allowLocalPreview = true,
  hostname,
} = {}) {
  const roles = collectUserRoles(user);
  const hasOwnerRole = roles.some((role) => OWNER_ROLES.has(role));
  const normalizedEmail = String(user?.email || "").toLowerCase();
  const envAllowlistMatch = Boolean(
    isAuthenticated && normalizedEmail && configuredOwnerEmails().includes(normalizedEmail),
  );
  const localPreviewAccess = Boolean(allowLocalPreview && isLocalPreviewHost(hostname));
  const liveOwnerAccess = Boolean(isAuthenticated && (hasOwnerRole || envAllowlistMatch));
  const allowed = localPreviewAccess || liveOwnerAccess;
  const reason = localPreviewAccess
    ? "local_preview_bypass"
    : liveOwnerAccess
      ? hasOwnerRole
        ? "authenticated_owner_role"
        : "authenticated_owner_allowlist"
      : isAuthenticated
        ? "authenticated_non_owner"
        : "not_authenticated";

  return {
    allowed,
    liveOwnerAccess,
    localPreviewAccess,
    roles,
    reason,
    roleSource: hasOwnerRole ? "role" : envAllowlistMatch ? "env_allowlist" : "none",
  };
}

export function normalizeRequestedMode(value = "") {
  const mode = String(value || "").toLowerCase();
  if (OWNER_MODE_ALIASES.has(mode)) return "owner";
  if (mode === "demo") return "demo";
  return "";
}

export function resolveWorkbenchMode({ requestedMode = "" } = {}) {
  // Demo mode retired — always operate in full owner mode.
  const normalizedMode = normalizeRequestedMode(requestedMode);
  if (normalizedMode === "demo") return "demo";
  return "owner";
}