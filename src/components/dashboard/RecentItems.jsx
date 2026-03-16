import React from "react";
import { motion } from "framer-motion";

const items = [
  { initials: "AB", name: "Project Alpha", time: "2m ago", color: "bg-indigo-100 text-indigo-700" },
  { initials: "KL", name: "Design System v2", time: "14m ago", color: "bg-violet-100 text-violet-700" },
  { initials: "RS", name: "API Integration", time: "1h ago", color: "bg-emerald-100 text-emerald-700" },
  { initials: "WT", name: "Security Audit", time: "3h ago", color: "bg-amber-100 text-amber-700" },
  { initials: "MN", name: "Performance Review", time: "5h ago", color: "bg-rose-100 text-rose-700" },
];

export default function RecentItems() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
      className="bg-white rounded-2xl p-6 border border-black/[0.04]"
    >
      <h3 className="text-sm font-semibold text-[#0a0a0a] mb-1">Recent</h3>
      <p className="text-xs text-[#0a0a0a]/35 mb-5">Latest activity</p>

      <div className="space-y-1">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0a0a0a]/[0.02] transition-colors cursor-default"
          >
            <div
              className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-[10px] font-bold shrink-0`}
            >
              {item.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0a0a0a] truncate">
                {item.name}
              </p>
            </div>
            <span className="text-[11px] text-[#0a0a0a]/25 shrink-0">
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}