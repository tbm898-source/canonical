export const portalData = {
  generated_at: "2026-04-22T09:30:00-07:00",
  portal_theme: {
    theme_key: "prism_default",
    title: "PRISM Program Helper",
    subtitle: "CANONICAL instructional memory, draft generation, and curated demo access.",
    mode_label: "Owner workbench + demo viewer",
    accent_primary: "#0A7C86",
    accent_secondary: "#C7502F",
    accent_tertiary: "#D9A21B"
  },
  users: [
    {
      id: "user_owner_preview",
      label: "Owner preview",
      portal_role: "owner",
      can_view_prism: true
    },
    {
      id: "user_demo_viewer",
      label: "Demo viewer",
      portal_role: "demo_viewer",
      can_view_prism: false
    }
  ],
  source_of_truth: {
    canonical_root: "CANONICAL://",
    mirror_mode: "CANONICAL files remain authoritative; Base44 mirrors structured instructional records.",
    portal_scope: "Owner workbench with curated demo viewer and future AYA export surface."
  },
  boundary_model: [
    {
      key: "canonical",
      label: "CANONICAL",
      role: "Durable file spine and personal control surface",
      ownership: "Tim's broader personal system for filed work, prototypes, showcase material, and approved instructional records.",
      demo_rule: "Demo can show approved summaries and generated previews, but not raw private files, local paths, keys, or draft logs."
    },
    {
      key: "aya",
      label: "AYA",
      role: "Alternative Youth Activities",
      ownership: "Nonprofit employer context where institution-safe instructional materials may be delivered or exported.",
      demo_rule: "AYA-safe output can be shown when it is student/institution appropriate and approved."
    },
    {
      key: "cts",
      label: "CTS",
      role: "AYA-facing instructional delivery rail",
      ownership: "The clean delivery lane for shop instructions, classroom copy, student logs, evidence prompts, and program packets.",
      demo_rule: "CTS material should stay practical, safe, reusable, and separated from private PRISM reasoning."
    },
    {
      key: "prism",
      label: "PRISM",
      role: "Private instructional framework",
      ownership: "Built independently on personal time and hardware; raw facilitator logic remains private by default.",
      demo_rule: "Demo can include curated PRISM framing only, never raw private guidance or internal reasoning."
    }
  ],
  demo_agent_capabilities: [
    "Normalize rough daily class notes into a Session Brief",
    "Prepare an AYA/CTS daily instruction packet outline",
    "Prepare student build-log and QC/evidence prompts",
    "Prepare Google Classroom copy and a slide/deck outline",
    "Summarize PRISM as curated framing without exposing private notes",
    "Export demo-safe JSON/Markdown and print a packet preview"
  ],
  demo_story: [
    {
      label: "01",
      title: "Capture reality",
      body: "The helper starts from messy classflow notes, not an idealized pacing guide."
    },
    {
      label: "02",
      title: "Normalize the brief",
      body: "Completed, remaining, blocked, learning, evidence, and next step become the Session Brief."
    },
    {
      label: "03",
      title: "Split the rails",
      body: "AYA stays student/institution-safe while PRISM keeps facilitator intelligence private or curated."
    },
    {
      label: "04",
      title: "File the bundle",
      body: "Approved artifacts point back to CANONICAL packages so the portal does not drift from the file spine."
    }
  ],
  brief_quality_checks: [
    {
      label: "Actual stage named",
      detail: "The session records where the build really is instead of pretending the calendar is correct.",
      status: "ready"
    },
    {
      label: "Blockers are explicit",
      detail: "Amp availability is captured as a condition, not hidden inside the plan.",
      status: "ready"
    },
    {
      label: "Evidence is part of instruction",
      detail: "Photos, build logs, QC cards, and continuity prompts are treated as build artifacts.",
      status: "ready"
    },
    {
      label: "Next action is concrete",
      detail: "The next helper run starts from QC and evidence, not from a blank prompt.",
      status: "ready"
    }
  ],
  export_adapters: [
    {
      label: "AYA / CTS",
      status: "Ready as curated source",
      scope: "AYA-safe packets, classroom copy, evidence prompts, and package metadata."
    },
    {
      label: "ClickUp / Staff Ops",
      status: "Future adapter",
      scope: "Approved task summaries only; no raw PRISM notes or local draft paths."
    },
    {
      label: "Google Classroom",
      status: "Prepared from bundle",
      scope: "Student-facing instructions, logs, reflection prompts, and upload structure."
    }
  ],
  programs: [
    {
      id: "program_aya_cts",
      program_key: "AYA_CTS",
      title: "AYA / CTS Instructional Delivery",
      institutional_owner: "Alternative Youth Activities",
      delivery_rail: "AYA / CTS",
      framework_rail: "PRISM",
      portal_status: "active",
      description:
        "Institutional delivery rail for Alternative Youth Activities CTS instruction, packets, classroom-facing assets, and reusable program continuity.",
      module_ids: ["module_edm101"]
    }
  ],
  modules: [
    {
      id: "module_edm101",
      program_id: "program_aya_cts",
      module_key: "EDM101",
      title: "EDM101 Capstone Subwoofer Build",
      course_code: "EDM101",
      cohort_label: "AYA / CTS",
      status: "active",
      description:
        "Capstone build sequence where hybrid classflow is normalized into a Session Brief, then emitted as AYA and PRISM rails plus downstream delivery artifacts.",
      summary_boxes: [
        { label: "Hierarchy", value: "Program → Module → Session" },
        { label: "Portal role", value: "Owner workbench + demo viewer" },
        { label: "Helper mode", value: "Cursor SDK drafts, approval before canonical" }
      ],
      session_ids: ["brief_edm101_day13"]
    }
  ],
  session_briefs: [
    {
      id: "brief_edm101_day13",
      module_id: "module_edm101",
      program_id: "program_aya_cts",
      program_key: "AYA_CTS",
      module_key: "EDM101",
      session_key: "EDM101_DAY13_2026-04-22",
      session_title: "EDM101 Day 13 — Near-final build day",
      session_date: "2026-04-22",
      actual_stage: "Near-final build day",
      completed: [
        "Yesterday's handle openings were cut and ready for installation prep",
        "Cabinet assembly reached final hopeful build-day stage"
      ],
      remaining: [
        "Install remaining faceplate-cover rails",
        "Mount handles in the openings cut yesterday",
        "Complete final paint and finish work",
        "Document the build honestly and clearly"
      ],
      blocked: [
        "Borrowed amp availability determines whether a first break-in demo can happen"
      ],
      student_learning: [
        "Finish discipline matters as much as large build milestones",
        "Evidence capture and QC are part of real build completion"
      ],
      evidence_captured: [
        "QC card/checklist",
        "Student build log",
        "Progress photos",
        "Continuity prompt"
      ],
      next_step:
        "Use QC results, evidence, and blocker status to generate the next session bundle from actual build state rather than calendar assumptions.",
      source_mode: "assistant",
      source_paths: [
        "CANONICAL://00_INBOX/Downloads/PRISM_AYA_AI_Continuity_Prompt_Template_v1.txt",
        "CANONICAL://00_INBOX/Downloads/EDM101_Day13_Complete_Filed_Package_2026-04-22.zip"
      ],
      brief_markdown: `# EDM101 Day 13 — Near-final build day

- Date: 2026-04-22
- Program: AYA_CTS
- Module: EDM101
- Actual stage: Near-final build day

## Completed
- Yesterday's handle openings were cut and ready for installation prep
- Cabinet assembly reached final hopeful build-day stage

## Remaining
- Install remaining faceplate-cover rails
- Mount handles in the openings cut yesterday
- Complete final paint and finish work
- Document the build honestly and clearly

## Blocked
- Borrowed amp availability determines whether a first break-in demo can happen

## Student learning
- Finish discipline matters as much as large build milestones
- Evidence capture and QC are part of real build completion

## Evidence captured
- QC card/checklist
- Student build log
- Progress photos
- Continuity prompt

## First next step
Use QC results, evidence, and blocker status to generate the next session bundle from actual build state rather than calendar assumptions.`,
      prism_guidance:
        "Today is a coherence day. Preserve quality, truthful documentation, and adaptive sequencing. If the build finishes early, pivot to demo, reflection, and continuity capture instead of filler."
    }
  ],
  session_bundles: [
    {
      id: "bundle_edm101_day13",
      session_brief_id: "brief_edm101_day13",
      module_id: "module_edm101",
      program_id: "program_aya_cts",
      session_key: "EDM101_DAY13_2026-04-22",
      session_date: "2026-04-22",
      aya_prefix: "AYA_CTS_EDM101_Day13",
      prism_prefix: "PRISM_EDM101_Day13",
      delivery_status: "generated",
      primary_package_path:
        "CANONICAL://00_INBOX/Downloads/EDM101_Day13_Complete_Filed_Package_2026-04-22.zip",
      filing_readme_member: "EDM101_Day13_Filing_README_2026-04-22.txt",
      slide_status: "prepared",
      classroom_status: "prepared",
      aya_export_status: "prepared",
      print_order: [
        "AYA_CTS_EDM101_Day13_and_Template_Print_Packet_2026-04-22.pdf",
        "AYA_CTS_EDM101_Day13_Final_QC_and_Evidence_Card_2026-04-22.pdf",
        "AYA_CTS_EDM101_Day13_Student_Build_Log_2026-04-22.pdf"
      ],
      owner_summary:
        "This is the owner-facing sample bundle. It keeps the full package, local paths, PRISM private rail, and generation context available for review.",
      demo_summary:
        "Day 13 shows the system converting real class status into a clean AYA packet, evidence prompts, and a curated PRISM framing layer.",
      staff_summary:
        "This session bundle is the sample record for the portal prototype. It mirrors the complete filed package and keeps the continuity prompt as the canonical bridge artifact.",
      prism_private_summary:
        "The facilitator rail remains private by default. Demo viewers can see curated PRISM framing without raw facilitator notes or local files."
    }
  ],
  artifacts: [
    {
      id: "artifact_aya_packet",
      session_bundle_id: "bundle_edm101_day13",
      session_key: "EDM101_DAY13_2026-04-22",
      title: "AYA Print + Template Packet",
      artifact_type: "aya_packet",
      rail: "aya",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/EDM101_Day13_Complete_Filed_Package_2026-04-22.zip",
      archive_member:
        "AYA_CTS_EDM101_Day13_2026-04-22/AYA_CTS_EDM101_Day13_and_Template_Print_Packet_2026-04-22.pdf",
      visible_to_staff: true,
      visibility_scope: "aya_safe",
      is_primary: true,
      sort_order: 1,
      notes: "Combined AYA print packet.",
      demo_summary: "The student/institution-facing packet for the session."
    },
    {
      id: "artifact_qc_card",
      session_bundle_id: "bundle_edm101_day13",
      session_key: "EDM101_DAY13_2026-04-22",
      title: "AYA Final QC and Evidence Card",
      artifact_type: "aya_document",
      rail: "aya",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/EDM101_Day13_Complete_Filed_Package_2026-04-22.zip",
      archive_member:
        "AYA_CTS_EDM101_Day13_2026-04-22/AYA_CTS_EDM101_Day13_Final_QC_and_Evidence_Card_2026-04-22.pdf",
      visible_to_staff: true,
      visibility_scope: "aya_safe",
      is_primary: false,
      sort_order: 2,
      notes: "Truthful end-stage documentation and evidence capture.",
      demo_summary: "The evidence card makes completion visible and reusable."
    },
    {
      id: "artifact_build_log",
      session_bundle_id: "bundle_edm101_day13",
      session_key: "EDM101_DAY13_2026-04-22",
      title: "AYA Student Build Log",
      artifact_type: "aya_document",
      rail: "aya",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/EDM101_Day13_Complete_Filed_Package_2026-04-22.zip",
      archive_member:
        "AYA_CTS_EDM101_Day13_2026-04-22/AYA_CTS_EDM101_Day13_Student_Build_Log_2026-04-22.pdf",
      visible_to_staff: true,
      visibility_scope: "aya_safe",
      is_primary: false,
      sort_order: 3,
      notes: "Student role, work, and reflection capture.",
      demo_summary: "Student reflection and contribution capture."
    },
    {
      id: "artifact_gc_map",
      session_bundle_id: "bundle_edm101_day13",
      session_key: "EDM101_DAY13_2026-04-22",
      title: "AYA Google Classroom Program Template Map",
      artifact_type: "classroom_copy",
      rail: "aya",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/EDM101_Day13_Complete_Filed_Package_2026-04-22.zip",
      archive_member:
        "AYA_CTS_EDM101_Day13_2026-04-22/AYA_CTS_Google_Classroom_Program_Template_Map_v1.pdf",
      visible_to_staff: true,
      visibility_scope: "aya_safe",
      is_primary: false,
      sort_order: 4,
      notes: "Program-side classroom structure guide.",
      demo_summary: "Classroom organization pattern for reuse."
    },
    {
      id: "artifact_prism_prompt",
      session_bundle_id: "bundle_edm101_day13",
      session_key: "EDM101_DAY13_2026-04-22",
      title: "PRISM / AYA Continuity Prompt",
      artifact_type: "continuity_prompt",
      rail: "prism",
      source_kind: "file",
      file_path:
        "CANONICAL://00_INBOX/Downloads/PRISM_AYA_AI_Continuity_Prompt_Template_v1.txt",
      archive_member: "",
      visible_to_staff: false,
      visibility_scope: "prism_private",
      is_primary: true,
      sort_order: 10,
      notes: "Canonical bridge artifact.",
      private_notes: "Use this to regenerate the next session from real state."
    },
    {
      id: "artifact_prism_overlay",
      session_bundle_id: "bundle_edm101_day13",
      session_key: "EDM101_DAY13_2026-04-22",
      title: "PRISM Facilitator Overlay",
      artifact_type: "prism_document",
      rail: "prism",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/EDM101_Day13_Complete_Filed_Package_2026-04-22.zip",
      archive_member:
        "PRISM_Framework_EDM101_Day13_2026-04-22/PRISM_EDM101_Day13_Facilitator_Overlay_2026-04-22.pdf",
      visible_to_staff: true,
      visibility_scope: "prism_curated",
      is_primary: false,
      sort_order: 11,
      notes: "Private facilitator logic.",
      demo_summary: "Curated PRISM view: this day emphasized coherence, finish discipline, evidence, and adaptive sequencing."
    },
    {
      id: "artifact_prism_packet",
      session_bundle_id: "bundle_edm101_day13",
      session_key: "EDM101_DAY13_2026-04-22",
      title: "PRISM Framework Packet",
      artifact_type: "prism_packet",
      rail: "prism",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/EDM101_Day13_Complete_Filed_Package_2026-04-22.zip",
      archive_member:
        "PRISM_Framework_EDM101_Day13_2026-04-22/PRISM_EDM101_Framework_Packet_2026-04-22.pdf",
      visible_to_staff: false,
      visibility_scope: "prism_private",
      is_primary: false,
      sort_order: 12,
      notes: "Private framework packet."
    },
    {
      id: "artifact_complete_package",
      session_bundle_id: "bundle_edm101_day13",
      session_key: "EDM101_DAY13_2026-04-22",
      title: "Complete Filed Package",
      artifact_type: "zip_package",
      rail: "shared",
      source_kind: "file",
      file_path:
        "CANONICAL://00_INBOX/Downloads/EDM101_Day13_Complete_Filed_Package_2026-04-22.zip",
      archive_member: "",
      visible_to_staff: false,
      visibility_scope: "owner_private",
      is_primary: true,
      sort_order: 20,
      notes: "Primary package that anchors the mirrored session bundle."
    },
    {
      id: "artifact_filing_readme",
      session_bundle_id: "bundle_edm101_day13",
      session_key: "EDM101_DAY13_2026-04-22",
      title: "Filing README",
      artifact_type: "readme",
      rail: "shared",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/EDM101_Day13_Complete_Filed_Package_2026-04-22.zip",
      archive_member: "EDM101_Day13_Filing_README_2026-04-22.txt",
      visible_to_staff: true,
      visibility_scope: "demo_safe",
      is_primary: false,
      sort_order: 21,
      notes: "Package intent and print order.",
      demo_summary: "A safe overview of how the package is filed and intended to be used."
    }
  ],
  agent_runs: [
    {
      id: "agentrun_edm101_day13_draft",
      run_key: "EDM101_DAY13_2026-04-22_DEMO_DRAFT",
      session_brief_id: "brief_edm101_day13",
      session_key: "EDM101_DAY13_2026-04-22",
      runtime: "local_cursor_sdk",
      status: "draft_ready",
      approval_status: "waiting_review",
      draft_path:
        "CANONICAL://00_INBOX/AI_DRAFTS/INSTRUCTIONAL/EDM101_DAY13_2026-04-22_DEMO_DRAFT",
      summary:
        "Sample local helper run showing the draft-then-approve workflow. Owner mode can review it; demo mode cannot see draft paths or logs.",
      started_at: "2026-04-22T09:00:00-07:00",
      finished_at: "2026-04-22T09:08:00-07:00"
    }
  ],
  helper_seed_input: `Session title: EDM101 Day 13 — Near-final build day
Date: 2026-04-22
Actual stage: Near-final build day

Completed:
- Cabinet assembly reached final hopeful build-day stage
- Yesterday's handle openings were cut and ready for installation prep

Remaining:
- Install remaining faceplate-cover rails
- Mount handles in the openings cut yesterday
- Complete final paint and finish work
- Document the build honestly and clearly

Blocked:
- Borrowed amp availability determines whether a first break-in demo can happen

Student learning:
- Finish discipline matters as much as large build milestones
- Evidence capture and QC are part of real build completion

Evidence captured:
- QC card/checklist
- Student build log
- Progress photos

Next step: Use QC results, evidence, and blocker status to generate the next session bundle from actual build state rather than calendar assumptions.`
};
