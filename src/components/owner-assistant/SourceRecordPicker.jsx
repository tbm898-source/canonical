import React, { useEffect, useState } from "react";
import { Inbox, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  profileSupportsRail,
  profileSupportsVisibility,
} from "@/lib/generationProfiles";

const REVIEW_REQUIRED_BADGE = "review required";
const LOW_CONFIDENCE_BADGE = "low confidence";
const LOW_CONFIDENCE_THRESHOLD = 0.7;

export default function SourceRecordPicker({
  ownerAccessAllowed,
  selectedProfile,
  selectedSourceRecordIds,
  onChange,
}) {
  const [state, setState] = useState({ status: "idle", records: [] });

  useEffect(() => {
    if (!ownerAccessAllowed) {
      setState({ status: "idle", records: [] });
      return undefined;
    }

    let cancelled = false;
    setState({ status: "loading", records: [] });

    (async () => {
      try {
        const { base44 } = await import("@/api/base44Client");
        const response = await base44.functions.invoke("listOwnerInboxManifest", {});
        if (cancelled) return;
        const result = response?.data ?? response;
        if (!result || result.success !== true || !Array.isArray(result.source_records)) {
          setState({
            status: "error",
            records: [],
            error: result?.error || "Inbox manifest unavailable.",
          });
          return;
        }
        setState({ status: "ready", records: result.source_records });
      } catch (err) {
        if (cancelled) return;
        setState({
          status: "error",
          records: [],
          error: err?.message || "Network error while loading inbox manifest.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ownerAccessAllowed]);

  const selectedSet = new Set(
    Array.isArray(selectedSourceRecordIds) ? selectedSourceRecordIds : [],
  );

  function toggleRecord(record, compatible) {
    if (!compatible) return;
    const next = new Set(selectedSet);
    if (next.has(record.source_record_id)) {
      next.delete(record.source_record_id);
    } else {
      next.add(record.source_record_id);
    }
    if (typeof onChange === "function") {
      onChange(Array.from(next));
    }
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
        Source records (inbox manifest)
      </h3>
      <p className="mt-1 text-xs leading-5 text-[#0a0a0a]/55">
        Records incompatible with the selected profile are dimmed. Selection is metadata-only;
        no source bodies are fetched. Pick one or more to attach to the dry-run plan.
      </p>

      {state.status === "loading" ? (
        <div className="mt-3 rounded-xl border border-dashed border-black/10 bg-white/50 px-4 py-6 text-center text-xs text-[#0a0a0a]/55">
          Loading inbox manifest...
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-xs text-rose-700">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            Could not load inbox manifest.
          </div>
          {state.error ? (
            <p className="mt-1 break-words text-[11px] text-rose-700/80">{state.error}</p>
          ) : null}
        </div>
      ) : null}

      {state.status === "ready" && state.records.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-black/10 bg-white/50 px-4 py-6 text-center text-xs text-[#0a0a0a]/55">
          <Inbox className="mx-auto mb-1.5 h-4 w-4 text-[#0a0a0a]/40" />
          The inbox manifest returned no records.
        </div>
      ) : null}

      {state.status === "ready" && state.records.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {state.records.map((record) => {
            const railSupported = selectedProfile
              ? profileSupportsRail(selectedProfile, record.rail_guess)
              : true;
            const visibilitySupported = selectedProfile
              ? profileSupportsVisibility(selectedProfile, record.privacy_guess)
              : true;
            const usableSupported = selectedProfile
              ? Array.isArray(record.usable_for) &&
                record.usable_for.includes(selectedProfile.output_type)
              : true;
            const compatible = railSupported && visibilitySupported && usableSupported;
            const isSelected = selectedSet.has(record.source_record_id);
            const lowConfidence =
              typeof record.confidence === "number" &&
              record.confidence < LOW_CONFIDENCE_THRESHOLD;

            return (
              <li key={record.source_record_id}>
                <label
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${
                    compatible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  } ${
                    isSelected && compatible
                      ? "border-[#0a0a0a]/40 bg-white"
                      : "border-black/5 bg-white/60 hover:bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="owner-assistant-source-record"
                    value={record.source_record_id}
                    checked={isSelected && compatible}
                    disabled={!compatible}
                    aria-disabled={!compatible}
                    onChange={() => toggleRecord(record, compatible)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#0a0a0a]">
                        {record.file_name}
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {record.source_record_id}
                      </Badge>
                      {record.review_required ? (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                          {REVIEW_REQUIRED_BADGE}
                        </span>
                      ) : null}
                      {lowConfidence ? (
                        <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-800">
                          {LOW_CONFIDENCE_BADGE}
                        </span>
                      ) : null}
                      {selectedProfile && !railSupported ? (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          rail not allowed
                        </span>
                      ) : null}
                      {selectedProfile && !visibilitySupported ? (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          visibility not allowed
                        </span>
                      ) : null}
                      {selectedProfile && !usableSupported ? (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          not usable for {selectedProfile.output_type}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-[#0a0a0a]/55">
                      <span>
                        rail: <span className="font-mono">{record.rail_guess}</span>
                      </span>
                      <span>
                        privacy:{" "}
                        <span className="font-mono">{record.privacy_guess}</span>
                      </span>
                      <span>
                        confidence:{" "}
                        <span className="font-mono">
                          {typeof record.confidence === "number"
                            ? record.confidence.toFixed(2)
                            : "-"}
                        </span>
                      </span>
                      <span>
                        usable_for:{" "}
                        <span className="font-mono">
                          {Array.isArray(record.usable_for) && record.usable_for.length
                            ? record.usable_for.join(", ")
                            : "-"}
                        </span>
                      </span>
                    </div>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
