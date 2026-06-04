import { useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getOwnerAccessState } from "@/lib/ownerAccessPolicy";

export const TAB_IDS = {
  START: "start",
  PROGRAMS: "programs",
  EXAMPLES: "examples",
  MORE: "more",
  ADMIN: "admin",
};

export function useNavModel() {
  const { user, isAuthenticated } = useAuth();
  const ownerAccess = useMemo(
    () => getOwnerAccessState({ user, isAuthenticated }),
    [isAuthenticated, user],
  );

  const roleLabel = ownerAccess.liveOwnerAccess
    ? "Admin"
    : isAuthenticated
      ? "Class access"
      : "Signed out";

  const primaryAction = {
    label: "Open today's class",
    to: "/ProgramHelper?mode=demo",
  };

  const tabs = useMemo(() => {
    const base = [
      { id: TAB_IDS.START, label: "Start", to: "/start", match: ["/start", "/Home"] },
      {
        id: TAB_IDS.PROGRAMS,
        label: "Programs",
        to: "/ProgramHelper?mode=demo",
        match: ["/ProgramHelper"],
      },
      {
        id: TAB_IDS.EXAMPLES,
        label: "Examples",
        to: "/field-proof-week1",
        match: ["/field-proof-week1", "/FieldProofWeek1"],
      },
      { id: TAB_IDS.MORE, label: "More", to: "/more", match: ["/more", "/About", "/portfolio", "/HowItWorks", "/Integrations", "/Proof", "/Docs", "/WorkspaceSetup"] },
    ];

    if (ownerAccess.allowed) {
      base.push({
        id: TAB_IDS.ADMIN,
        label: "Admin",
        to: "/admin",
        match: ["/admin", "/Dashboard", "/OwnerAssistant", "/Settings"],
      });
    }

    return base;
  }, [ownerAccess.allowed]);

  return {
    user,
    isAuthenticated,
    ownerAccess,
    roleLabel,
    primaryAction,
    tabs,
    showAdmin: ownerAccess.allowed,
  };
}

export function pathMatchesTab(pathname, tab) {
  if (tab.match?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  return pathname === tab.to.split("?")[0];
}
