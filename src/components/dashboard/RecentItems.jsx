import React, { useState } from "react";
import { motion } from "framer-motion";

const allItems = [
  { initials: "AB", name: "Project Alpha", time: "2m ago", priority: "high", order: 1, color: "bg-indigo-100 text-indigo-700" },
  { initials: "KL", name: "Design System v2", time: "14m ago", priority: "medium", order: 2, color: "bg-violet-100 text-violet-700" },
  { initials: "RS", name: "API Integration", time: "1h ago", priority: "high", order: 3, color: "bg-emerald-100 text-emerald-700" },
  { initials: "WT", name: "Security Audit", time: "3h ago", priority: "low", order: 4, color: "bg-amber-100 text-amber-700" },
  { initials: "MN", name: "Performance Review", time: "5h ago", priority: "medium", order: 5, color: "bg-rose-100 text-rose-700" },
];

const priorityOrder = { high: 0, medium: 1, low: 2 };

const priorityBadge = {
  high: "bg-rose-50 text-rose-500",
  medium: "bg-amber-50 text-amber-500",
  low: "bg-slate-100 text-slate-400",
};

export default function RecentItems() {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("date");

  const filtered = allItems
    .filter((item) => filter === "all" || item.priority === filter)
    .sort((a, b) =>
      sort === "priority"
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : a.order - b.order
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
      className="bg-white rounded-2xl p-6 border border-black/[0.04]"
    >
      <h3 className="text-sm font-semibold text-[#0a0a0a] mb-1">Recent</h3>
      <p className="text-xs text-[#0a0a0a]/35 mb-4">Latest activity</p>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Priority filter pills */}
        <div className="flex items-center gap-1 flex-1 min-w-0 flex-wrap">
          {["all", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors capitalize ${
                filter === p
                  ? "bg-[#0a0a0a] text-white"
                  : "bg-[#0a0a0a]/[0.04] text-[#0a0a0a]/50 hover:bg-[#0a0a0a]/[0.08]"
              }`}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSort((s) => (s === "date" ? "priority" : "date"))}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#0a0a0a]/[0.04] text-[#0a0a0a]/50 hover:bg-[#0a0a0a]/[0.08] transition-colors shrink-0"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M9 17h6" />
          </svg>
          {sort === "date" ? "Date" : "Priority"}
        </button>
      </div>

      <div className="space-y-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-[#0a0a0a]/30 text-center py-4">No items</p>
        ) : (
          filtered.map((item, i) => (
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
                <p className="text-sm font-medium text-[#0a0a0a] truncate">{item.name}</p>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md capitalize shrink-0 ${priorityBadge[item.priority]}`}>
                {item.priority}
              </span>
              <span className="text-[11px] text-[#0a0a0a]/25 shrink-0">{item.time}</span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}