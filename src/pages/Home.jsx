import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Layers, Zap, Shield, Globe, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  {
    icon: Layers,
    title: "Structured",
    description: "Every element has purpose. Clean architecture built for clarity.",
  },
  {
    icon: Zap,
    title: "Performant",
    description: "Optimized for speed. Zero bloat, maximum efficiency.",
  },
  {
    icon: Shield,
    title: "Reliable",
    description: "Built on solid foundations. Trust the system.",
  },
  {
    icon: Globe,
    title: "Universal",
    description: "Works everywhere. Adapts to any context seamlessly.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa] overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0a0a0a] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">C</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[#0a0a0a]">
              CANONICAL
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/About"
              className="text-sm text-[#0a0a0a]/50 hover:text-[#0a0a0a] transition-colors"
            >
              About
            </Link>
            <Link
              to="/Dashboard"
              className="text-sm text-[#0a0a0a]/50 hover:text-[#0a0a0a] transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-8"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-medium text-indigo-600 tracking-wide">
                NOW LIVE
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl sm:text-7xl font-bold tracking-tight text-[#0a0a0a] leading-[1.05]"
            >
              The standard
              <br />
              <span className="text-[#0a0a0a]/20">for modern</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                applications.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-8 text-lg text-[#0a0a0a]/50 max-w-xl leading-relaxed"
            >
              CANONICAL sets the definitive reference point. Built with precision,
              designed for permanence. This is what software should feel like.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="mt-10 flex items-center gap-4"
            >
              <Link to="/Dashboard">
                <Button className="h-12 px-6 bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white rounded-xl text-sm font-medium gap-2 transition-all hover:gap-3">
                  Open Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/About">
                <Button
                  variant="ghost"
                  className="h-12 px-6 text-[#0a0a0a]/60 hover:text-[#0a0a0a] rounded-xl text-sm font-medium"
                >
                  Learn more
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Decorative grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute top-32 right-0 w-1/2 h-96 pointer-events-none hidden lg:block"
          >
            <div className="grid grid-cols-4 gap-3 opacity-[0.04]">
              {Array(16)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-[#0a0a0a] rounded-2xl"
                  />
                ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-black/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i}
                className="group relative p-8 rounded-2xl hover:bg-white transition-all duration-500 cursor-default"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0a0a0a]/[0.03] group-hover:bg-indigo-50 flex items-center justify-center mb-5 transition-colors duration-500">
                  <feature.icon className="w-5 h-5 text-[#0a0a0a]/30 group-hover:text-indigo-600 transition-colors duration-500" />
                </div>
                <h3 className="text-[15px] font-semibold text-[#0a0a0a] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#0a0a0a]/40 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-32 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] p-12 sm:p-16"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                Ready to begin?
              </h2>
              <p className="text-white/40 max-w-md mb-8">
                Start building with CANONICAL today. The reference architecture
                for your next project.
              </p>
              <Link to="/Dashboard">
                <Button className="h-11 px-6 bg-white text-[#0a0a0a] hover:bg-white/90 rounded-xl text-sm font-medium gap-2">
                  Get Started
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#0a0a0a] rounded-md flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">C</span>
            </div>
            <span className="text-xs text-[#0a0a0a]/30">
              CANONICAL © {new Date().getFullYear()}
            </span>
          </div>
          <span className="text-xs text-[#0a0a0a]/20">
            Built with precision
          </span>
        </div>
      </footer>
    </div>
  );
}