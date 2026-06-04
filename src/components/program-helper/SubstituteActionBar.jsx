import React from "react";
import { Link } from "react-router-dom";
import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Sticky bottom actions for demo/classroom use on small screens. */
export default function SubstituteActionBar({ onGenerate, generateLabel = "Generate packet" }) {
  return (
    <div
      className="canonical-substitute-bar fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#fafafa]/95 px-4 py-3 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      role="region"
      aria-label="Quick class actions"
    >
      <div className="mx-auto flex max-w-lg gap-2">
        <a href="#session" className="flex-1">
          <Button variant="outline" className="h-12 w-full gap-2 rounded-xl text-sm font-medium">
            <FileText className="h-4 w-4 shrink-0" />
            Session
          </Button>
        </a>
        <a href="#agent-demo" className="flex-1">
          <Button
            type="button"
            className="h-12 w-full gap-2 rounded-xl bg-[#0a0a0a] text-sm font-medium text-white hover:bg-[#1a1a1a]"
            onClick={onGenerate}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            {generateLabel}
          </Button>
        </a>
        <Link to="/field-proof-week1" className="hidden min-[380px]:block">
          <Button variant="ghost" className="h-12 rounded-xl px-3 text-xs text-[#0a0a0a]/55">
            Example
          </Button>
        </Link>
      </div>
    </div>
  );
}
