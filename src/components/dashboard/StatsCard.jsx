import React from "react";
import { motion } from "framer-motion";

export default function StatsCard({ stat, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group bg-white rounded-2xl p-6 border border-black/[0.04] hover:border-black/[0.08] transition-all duration-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl bg-[#0a0a0a]/[0.03] group-hover:bg-indigo-50 flex items-center justify-center transition-colors duration-500">
          <stat.icon className="w-4 h-4 text-[#0a0a0a]/25 group-hover:text-indigo-600 transition-colors duration-500" />
        </div>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          {stat.change}
        </span>
      </div>
      <p className="text-2xl font-bold text-[#0a0a0a] tracking-tight">
        {stat.value}
      </p>
      <p className="text-xs text-[#0a0a0a]/35 mt-1">{stat.label}</p>
    </motion.div>
  );
}