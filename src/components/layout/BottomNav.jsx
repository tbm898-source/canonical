import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Home, Layers, MoreHorizontal, Shield } from "lucide-react";
import { pathMatchesTab, TAB_IDS } from "@/hooks/use-nav-model";

const TAB_ICONS = {
  [TAB_IDS.START]: Home,
  [TAB_IDS.PROGRAMS]: BookOpen,
  [TAB_IDS.EXAMPLES]: Layers,
  [TAB_IDS.MORE]: MoreHorizontal,
  [TAB_IDS.ADMIN]: Shield,
};

export default function BottomNav({ tabs }) {
  const { pathname } = useLocation();

  return (
    <nav
      className="canonical-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-[#fafafa]/95 backdrop-blur-xl lg:hidden"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.id] || MoreHorizontal;
          const active = pathMatchesTab(pathname, tab);
          return (
            <li key={tab.id} className="flex-1">
              <Link
                to={tab.to}
                className={`flex min-h-[var(--tap-min)] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors ${
                  active ? "text-indigo-600" : "text-[#0a0a0a]/45"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={`h-5 w-5 ${active ? "text-indigo-600" : ""}`} aria-hidden />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
