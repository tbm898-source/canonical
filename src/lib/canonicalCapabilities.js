export function getCapabilityRegistry({ owner, generatedPackage }) {
  const base = [
    {
      key: "session_brief",
      label: "Session Brief generation",
      status: "available",
      reason: "Always available in both demo and owner mode.",
    },
    {
      key: "aya_daily_plan",
      label: "AYA Daily Plan",
      status: "available",
      reason: "AYA-safe output available in demo and owner mode.",
    },
    {
      key: "student_work_log",
      label: "Student Work Log",
      status: "available",
      reason: "Student-safe output available in all modes.",
    },
    {
      key: "qc_evidence_card",
      label: "QC / Evidence Card",
      status: "available",
      reason: "Evidence capture available in all modes.",
    },
    {
      key: "slide_outline",
      label: "Slide / Deck Outline",
      status: "available",
      reason: "Slide outline available in all modes.",
    },
    {
      key: "classroom_copy",
      label: "Google Classroom Draft",
      status: owner ? "available" : "demo_only",
      reason: owner
        ? "Owner mode can prepare classroom drafts."
        : "Prepared locally in demo mode. No connector call.",
    },
    {
      key: "prism_curated",
      label: "Curated PRISM Framing",
      status: "available",
      reason: "Demo-safe PRISM framing available in all modes.",
    },
    {
      key: "filing_plan",
      label: "Filing / Package Plan",
      status: "available",
      reason: "Filing plan prepared locally.",
    },
    {
      key: "json_export",
      label: "JSON Export",
      status: generatedPackage ? "ready" : "needs_generation",
      reason: generatedPackage
        ? "Packet generated — JSON export ready."
        : "Generate a packet first.",
    },
    {
      key: "markdown_export",
      label: "Markdown Export",
      status: generatedPackage ? "ready" : "needs_generation",
      reason: generatedPackage
        ? "Packet generated — Markdown export ready."
        : "Generate a packet first.",
    },
    {
      key: "dropbox_save",
      label: "Dropbox Save",
      status: owner ? (generatedPackage ? "available" : "needs_generation") : "blocked_demo",
      reason: owner
        ? generatedPackage
          ? "Owner mode with packet ready. Requires spine discovery and approval."
          : "Generate a packet first to enable Dropbox save."
        : "Dropbox connector writes are blocked in demo mode.",
    },
  ];

  return base;
}