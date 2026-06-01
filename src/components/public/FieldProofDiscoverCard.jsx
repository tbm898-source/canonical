import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FieldProofDiscoverCard({ className = "" }) {
  return (
    <section
      className={`rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-6 shadow-sm sm:p-8 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
          <BookOpenCheck className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Field proof
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-[#0a0a0a] sm:text-2xl">
            Field Proof: Week 1 Operating Spine
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/60">
            See how CANONICAL turned an upcoming trades/pre-apprenticeship cohort plan into a
            complete Week 1 teaching system: daily ops, student activity sheets, evidence
            routines, task planning, print mapping, and missing-item tracking.
          </p>
          <Link to="/field-proof-week1" className="mt-5 inline-block">
            <Button className="h-11 gap-2 rounded-xl bg-[#0a0a0a] px-5 text-sm font-medium text-white hover:bg-[#1a1a1a]">
              Open field proof
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
