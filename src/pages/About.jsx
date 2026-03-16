import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Target, Compass, Gem } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const principles = [
  {
    icon: Target,
    title: "Precision First",
    text: "Every decision is intentional. No excess, no shortcuts. Just exactly what's needed.",
  },
  {
    icon: Compass,
    title: "Clear Direction",
    text: "A single source of truth that guides every interaction and every line of code.",
  },
  {
    icon: Gem,
    title: "Crafted Quality",
    text: "Attention to detail at every level. From micro-interactions to system architecture.",
  },
];

export default function About() {
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
          <Link to="/Home">
            <Button variant="ghost" size="sm" className="gap-2 text-[#0a0a0a]/50 hover:text-[#0a0a0a]">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      <div className="pt-40 pb-32 px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto"
        >
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-xs font-medium text-indigo-600 tracking-widest uppercase mb-6"
          >
            About
          </motion.p>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0a0a0a] leading-tight mb-8"
          >
            A reference point
            <br />
            <span className="text-[#0a0a0a]/20">for everything we build.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-lg text-[#0a0a0a]/45 leading-relaxed mb-20 max-w-xl"
          >
            CANONICAL is more than an app — it's a philosophy. We believe in
            reducing noise, amplifying signal, and creating systems that speak
            for themselves through their design and function.
          </motion.p>

          <div className="space-y-1">
            {principles.map((p, i) => (
              <motion.div
                key={p.title}
                variants={fadeUp}
                custom={i + 3}
                className="group flex gap-6 p-6 rounded-2xl hover:bg-white transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl bg-[#0a0a0a]/[0.03] group-hover:bg-indigo-50 flex items-center justify-center shrink-0 transition-colors duration-500">
                  <p.icon className="w-5 h-5 text-[#0a0a0a]/25 group-hover:text-indigo-600 transition-colors duration-500" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#0a0a0a] mb-1">
                    {p.title}
                  </h3>
                  <p className="text-sm text-[#0a0a0a]/40 leading-relaxed">
                    {p.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}