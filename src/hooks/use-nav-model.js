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
    label: "Plan the next class",
    to: "/plan",
  };

  const tabs = useMemo(() => {
    const base = [
      { id: TAB_IDS.START, label: "Home", to: "/start", match: ["/start", "/Home"] },
      {
        id: TAB_IDS.PROGRAMS,
        label: "Curriculum",
        to: "/curriculum",
        match: ["/curriculum", "/Curriculum"],
      },
      {
        id: TAB_IDS.EXAMPLES,
        label: "Plan a class",
        to: "/plan",
        match: ["/plan"],
      },
      { id: TAB_IDS.MORE, label: "More", to: "/more", match: ["/more", "/About", "/portfolio", "/HowItWorks", "/Integrations", "/Proof", "/Docs", "/WorkspaceSetup", "/ProgramHelper", "/field-proof-week1", "/FieldProofWeek1", "/admin", "/Dashboard", "/OwnerAssistant", "/Settings", "/CommandCenter"] },
    ];

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
