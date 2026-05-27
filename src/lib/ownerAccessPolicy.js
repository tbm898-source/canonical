export const WORKBENCH_MODES = {
  OWNER: "owner",
  DEMO: "demo",
};

/**
 * Determine owner access state from auth context.
 */
export function getOwnerAccessState({ user, isAuthenticated }) {
  const roles = [];

  if (user?.role) roles.push(user.role);

  const isAdmin = roles.includes("admin");
  const isOwner = roles.includes("owner");
  const liveOwnerAccess = isAuthenticated && (isAdmin || isOwner);

  if (!isAuthenticated) {
    return {
      allowed: false,
      liveOwnerAccess: false,
      reason: "not_authenticated",
      roleSource: "none",
      roles,
    };
  }

  if (liveOwnerAccess) {
    return {
      allowed: true,
      liveOwnerAccess: true,
      reason: isAdmin ? "admin_role" : "owner_role",
      roleSource: "base44_auth",
      roles,
    };
  }

  return {
    allowed: false,
    liveOwnerAccess: false,
    reason: "insufficient_role",
    roleSource: "base44_auth",
    roles,
  };
}

/**
 * Normalize a raw mode string from URL params.
 */
export function normalizeRequestedMode(raw) {
  const val = String(raw || "").toLowerCase().trim();
  if (val === "owner") return "owner";
  if (val === "demo") return "demo";
  return "";
}

/**
 * Resolve the initial workbench mode based on request and access state.
 */
export function resolveWorkbenchMode({ requestedMode, ownerAccess, hasExplicitMode }) {
  if (requestedMode === "owner" && ownerAccess.allowed) return "owner";
  if (requestedMode === "demo") return "demo";
  if (!hasExplicitMode && ownerAccess.liveOwnerAccess) return "owner";
  return "demo";
}