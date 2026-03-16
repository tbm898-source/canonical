import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Activity,
  Users,
  FileText,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/dashboard/StatsCard";
import ActivityChart from "@/components/dashboard/ActivityChart";
import RecentItems from "@/components/dashboard/RecentItems";

const stats = [
  { label: "Total Views", value: "24.8K", change: "+12.3%", icon: Activity },
  { label: "Active Users", value: "1,429", change: "+8.1%", icon: Users },
  { label: "Documents", value: "348", change: "+3.7%", icon: FileText },
  { label: "Growth", value: "94.2%", change: "+2.4%", icon: TrendingUp },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/Home" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0a0a0a] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">C</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[#0a0a0a]">
              CANONICAL
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/Home">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-[#0a0a0a]/50 hover:text-[#0a0a0a]"
              >
                <ArrowLeft className="w-4 h-4" />
                Home
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
              Dashboard
            </h1>
            <p className="text-sm text-[#0a0a0a]/40 mt-1">
              Overview of your workspace
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <StatsCard key={stat.label} stat={stat} index={i} />
            ))}
          </div>

          {/* Charts & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ActivityChart />
            </div>
            <RecentItems />
          </div>
        </div>
      </div>
    </div>
  );
}