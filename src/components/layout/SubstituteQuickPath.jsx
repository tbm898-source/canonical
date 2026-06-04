import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: FileText,
    title: "Sign in with your class login",
    text: "Use the username and password your coordinator gave you. After sign-in, open the class view.",
    action: { to: "/ProgramHelper?mode=demo#session", label: "Go to class view" },
  },
  {
    icon: Sparkles,
    title: "Generate a printable packet",
    text: "Paste rough notes, tap Generate, then print or copy what you need.",
    action: { to: "/ProgramHelper?mode=demo#agent-demo", label: "Go to generator" },
  },
  {
    icon: ClipboardList,
    title: "See a real Week 1 example",
    text: "Daily ops, student work, and evidence routines from a live cohort build.",
    action: { to: "/field-proof-week1", label: "View Week 1 proof" },
  },
];

export function SubstituteQuickPath({ className = "" }) {
  return (
    <section
      className={`rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-white p-6 shadow-sm sm:p-8 ${className}`}
      aria-labelledby="substitute-quick-path-heading"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
        Substitute or first-day use
      </p>
      <h2
        id="substitute-quick-path-heading"
        className="mt-2 text-2xl font-bold tracking-tight text-[#0a0a0a] sm:text-3xl"
      >
        Three steps after sign-in.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#0a0a0a]/60">
        If you are covering a class today, start here. Everything else on this site is optional background for
        operators and builders.
      </p>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-sm font-semibold text-white">
                {index + 1}
              </span>
              <step.icon className="h-5 w-5 text-emerald-600" aria-hidden />
            </div>
            <h3 className="text-base font-semibold text-[#0a0a0a]">{step.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-[#0a0a0a]/55">{step.text}</p>
            <Link to={step.action.to} className="mt-5">
              <Button
                variant="outline"
                className="h-11 w-full justify-between rounded-xl text-sm font-medium"
              >
                {step.action.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link to="/ProgramHelper?mode=demo">
          <Button className="h-12 w-full gap-2 rounded-xl bg-[#0a0a0a] px-6 text-sm font-medium text-white hover:bg-[#1a1a1a] sm:w-auto">
            Start with today's class
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-xs leading-5 text-[#0a0a0a]/45">
          Class logins are provisioned by your coordinator. Owner and admin tools use a separate admin sign-in.
        </p>
      </div>
    </section>
  );
}

export default SubstituteQuickPath;
