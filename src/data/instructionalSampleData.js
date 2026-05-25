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
    "Prepare student work-log and QC/evidence prompts",
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
      detail: "The session records where the class really is instead of pretending the calendar is correct.",
      status: "ready"
    },
    {
      label: "Blockers are explicit",
      detail: "Materials, time, and lab-readiness constraints are captured as conditions, not hidden inside the plan.",
      status: "ready"
    },
    {
      label: "Evidence is part of instruction",
      detail: "Student guides, practice checks, quizzes, answer keys, and continuity prompts are treated as instructional artifacts.",
      status: "ready"
    },
    {
      label: "Next action is concrete",
      detail: "The next helper run starts from real class status and evidence, not from a blank prompt.",
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
      module_ids: ["module_pv102"]
    }
  ],
  modules: [
    {
      id: "module_pv102",
      program_id: "program_aya_cts",
      module_key: "PV102",
      title: "PV102 Applied Solar Systems",
      course_code: "PV102",
      cohort_label: "AYA / CTS",
      status: "active",
      description:
        "Applied photovoltaics sequence where hybrid classflow is normalized into a Session Brief, then emitted as AYA and PRISM rails plus downstream delivery artifacts.",
      summary_boxes: [
        { label: "Hierarchy", value: "Program → Module → Session" },
        { label: "Portal role", value: "Owner workbench + demo viewer" },
        { label: "Helper mode", value: "Cursor SDK drafts, approval before canonical" }
      ],
      session_ids: ["brief_pv102_day5"]
    }
  ],
  session_briefs: [
    {
      id: "brief_pv102_day5",
      module_id: "module_pv102",
      program_id: "program_aya_cts",
      program_key: "AYA_CTS",
      module_key: "PV102",
      session_key: "PV102_DAY5_2026-03-26",
      session_title: "PV102 Day 5 — System sizing and safety checks",
      session_date: "2026-03-26",
      actual_stage: "Applied solar review day with sizing practice, safety checks, and quiz readiness",
      completed: [
        "Students completed prior PV fundamentals and component-identification work",
        "Day 5 packet set was generated with instructor, student, practice, quiz, and answer-key artifacts"
      ],
      remaining: [
        "Review voltage, current, power, and energy relationships in a solar context",
        "Practice basic PV system-sizing decisions using realistic loads",
        "Complete the Day 5 practice sheet and quiz",
        "Capture evidence of student reasoning and misconceptions for the next session"
      ],
      blocked: [
        "Hands-on lab depth depends on available PV components, meters, and safe demonstration space"
      ],
      student_learning: [
        "PV sizing depends on load, sunlight assumptions, voltage, current, and safety constraints",
        "A safe solar plan must explain why each component and protection step belongs in the system"
      ],
      evidence_captured: [
        "Student guide",
        "Practice sheet",
        "Quiz",
        "Answer key with rationale",
        "Instructor packet"
      ],
      next_step:
        "Use quiz results, practice-sheet evidence, and lab-readiness constraints to generate the next PV102 session from actual student understanding.",
      source_mode: "assistant",
      source_paths: [
        "CANONICAL://00_INBOX/Downloads/PV102_Day5_Print_Packet_2026-03-26.zip",
        "CANONICAL://00_INBOX/Downloads/PV102_Day5_Instructor_Packet_2026-03-26.pdf"
      ],
      brief_markdown: `# PV102 Day 5 — System sizing and safety checks

- Date: 2026-03-26
- Program: AYA_CTS
- Module: PV102
- Actual stage: Applied solar review day with sizing practice, safety checks, and quiz readiness

## Completed
- Students completed prior PV fundamentals and component-identification work
- Day 5 packet set was generated with instructor, student, practice, quiz, and answer-key artifacts

## Remaining
- Review voltage, current, power, and energy relationships in a solar context
- Practice basic PV system-sizing decisions using realistic loads
- Complete the Day 5 practice sheet and quiz
- Capture evidence of student reasoning and misconceptions for the next session

## Blocked
- Hands-on lab depth depends on available PV components, meters, and safe demonstration space

## Student learning
- PV sizing depends on load, sunlight assumptions, voltage, current, and safety constraints
- A safe solar plan must explain why each component and protection step belongs in the system

## Evidence captured
- Student guide
- Practice sheet
- Quiz
- Answer key with rationale
- Instructor packet

## First next step
Use quiz results, practice-sheet evidence, and lab-readiness constraints to generate the next PV102 session from actual student understanding.`,
      prism_guidance:
        "Today is a coherence day. Keep electrical safety, student reasoning, and evidence capture connected. If students move quickly, deepen the sizing scenario and reflection rather than adding filler."
    }
  ],
  session_bundles: [
    {
      id: "bundle_pv102_day5",
      session_brief_id: "brief_pv102_day5",
      module_id: "module_pv102",
      program_id: "program_aya_cts",
      session_key: "PV102_DAY5_2026-03-26",
      session_date: "2026-03-26",
      aya_prefix: "AYA_CTS_PV102_Day5",
      prism_prefix: "PRISM_PV102_Day5",
      delivery_status: "generated",
      primary_package_path:
        "CANONICAL://00_INBOX/Downloads/PV102_Day5_Print_Packet_2026-03-26.zip",
      filing_readme_member: "PV102_Day5_Print_Packet_2026-03-26.zip",
      slide_status: "prepared",
      classroom_status: "prepared",
      aya_export_status: "prepared",
      print_order: [
        "PV102_Day5_Instructor_Packet_2026-03-26.pdf",
        "PV102_Day5_Student_Guide_2026-03-26.pdf",
        "PV102_Day5_Practice_Sheet_2026-03-26.pdf",
        "PV102_Day5_Quiz_2026-03-26.pdf",
        "PV102_Day5_Answer_Key_with_Rationale_2026-03-26.pdf"
      ],
      owner_summary:
        "This is the owner-facing sample bundle. It keeps the full package, local paths, PRISM private rail, and generation context available for review.",
      demo_summary:
        "PV102 Day 5 shows the system converting solar class status into a clean AYA packet, practice/quiz materials, and a curated PRISM framing layer.",
      staff_summary:
        "This session bundle is the sample record for the portal prototype. It mirrors the complete filed package and keeps the continuity prompt as the canonical bridge artifact.",
      prism_private_summary:
        "The facilitator rail remains private by default. Demo viewers can see curated PRISM framing without raw facilitator notes or local files."
    }
  ],
  artifacts: [
    {
      id: "artifact_aya_packet",
      session_bundle_id: "bundle_pv102_day5",
      session_key: "PV102_DAY5_2026-03-26",
      title: "PV102 Day 5 Print Packet",
      artifact_type: "aya_packet",
      rail: "aya",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/PV102_Day5_Print_Packet_2026-03-26.zip",
      archive_member:
        "PV102_Day5_Instructor_Packet_2026-03-26.pdf",
      visible_to_staff: true,
      visibility_scope: "aya_safe",
      is_primary: true,
      sort_order: 1,
      notes: "Combined PV102 instructor-facing print packet.",
      demo_summary: "The instructor packet anchors the safe classroom-facing session."
    },
    {
      id: "artifact_student_guide",
      session_bundle_id: "bundle_pv102_day5",
      session_key: "PV102_DAY5_2026-03-26",
      title: "PV102 Day 5 Student Guide",
      artifact_type: "aya_document",
      rail: "aya",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/PV102_Day5_Print_Packet_2026-03-26.zip",
      archive_member:
        "PV102_Day5_Student_Guide_2026-03-26.pdf",
      visible_to_staff: true,
      visibility_scope: "aya_safe",
      is_primary: false,
      sort_order: 2,
      notes: "Student-facing guide for the PV102 Day 5 session.",
      demo_summary: "The student guide gives learners the safe, classroom-ready work surface."
    },
    {
      id: "artifact_practice_sheet",
      session_bundle_id: "bundle_pv102_day5",
      session_key: "PV102_DAY5_2026-03-26",
      title: "PV102 Day 5 Practice Sheet",
      artifact_type: "aya_document",
      rail: "aya",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/PV102_Day5_Print_Packet_2026-03-26.zip",
      archive_member:
        "PV102_Day5_Practice_Sheet_2026-03-26.pdf",
      visible_to_staff: true,
      visibility_scope: "aya_safe",
      is_primary: false,
      sort_order: 3,
      notes: "Sizing and reasoning practice for the session.",
      demo_summary: "The practice sheet captures reasoning before quiz or next-day generation."
    },
    {
      id: "artifact_quiz",
      session_bundle_id: "bundle_pv102_day5",
      session_key: "PV102_DAY5_2026-03-26",
      title: "PV102 Day 5 Quiz",
      artifact_type: "quiz",
      rail: "aya",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/PV102_Day5_Print_Packet_2026-03-26.zip",
      archive_member:
        "PV102_Day5_Quiz_2026-03-26.pdf",
      visible_to_staff: true,
      visibility_scope: "aya_safe",
      is_primary: false,
      sort_order: 4,
      notes: "Student-facing check for understanding.",
      demo_summary: "The quiz gives the helper evidence for the next PV102 session."
    },
    {
      id: "artifact_answer_key",
      session_bundle_id: "bundle_pv102_day5",
      session_key: "PV102_DAY5_2026-03-26",
      title: "PV102 Day 5 Answer Key with Rationale",
      artifact_type: "answer_key",
      rail: "aya",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/PV102_Day5_Print_Packet_2026-03-26.zip",
      archive_member:
        "PV102_Day5_Answer_Key_with_Rationale_2026-03-26.pdf",
      visible_to_staff: true,
      visibility_scope: "aya_safe",
      is_primary: false,
      sort_order: 5,
      notes: "Instructor-facing answer key with rationale.",
      demo_summary: "The answer key keeps the assessment reusable and instructor-safe."
    },
    {
      id: "artifact_prism_prompt",
      session_bundle_id: "bundle_pv102_day5",
      session_key: "PV102_DAY5_2026-03-26",
      title: "PRISM / AYA Continuity Prompt",
      artifact_type: "continuity_prompt",
      rail: "prism",
      source_kind: "file",
      file_path:
        "CANONICAL://00_INBOX/Downloads/PV102_Day5_Print_Packet_2026-03-26.zip",
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
      session_bundle_id: "bundle_pv102_day5",
      session_key: "PV102_DAY5_2026-03-26",
      title: "PV102 Curated PRISM Framing",
      artifact_type: "prism_document",
      rail: "prism",
      source_kind: "generated_summary",
      file_path: "",
      archive_member: "",
      visible_to_staff: true,
      visibility_scope: "prism_curated",
      is_primary: false,
      sort_order: 11,
      notes: "Curated, demo-safe framing only.",
      demo_summary: "Curated PRISM view: this session emphasizes safety coherence, sizing reasoning, evidence, and adaptive sequencing."
    },
    {
      id: "artifact_prism_packet",
      session_bundle_id: "bundle_pv102_day5",
      session_key: "PV102_DAY5_2026-03-26",
      title: "PRISM Framework Packet",
      artifact_type: "prism_packet",
      rail: "prism",
      source_kind: "private_framework",
      file_path: "",
      archive_member: "",
      visible_to_staff: false,
      visibility_scope: "prism_private",
      is_primary: false,
      sort_order: 12,
      notes: "Private framework packet."
    },
    {
      id: "artifact_complete_package",
      session_bundle_id: "bundle_pv102_day5",
      session_key: "PV102_DAY5_2026-03-26",
      title: "Complete Filed Package",
      artifact_type: "zip_package",
      rail: "shared",
      source_kind: "file",
      file_path:
        "CANONICAL://00_INBOX/Downloads/PV102_Day5_Print_Packet_2026-03-26.zip",
      archive_member: "",
      visible_to_staff: false,
      visibility_scope: "owner_private",
      is_primary: true,
      sort_order: 20,
      notes: "Primary package that anchors the mirrored session bundle."
    },
    {
      id: "artifact_filing_readme",
      session_bundle_id: "bundle_pv102_day5",
      session_key: "PV102_DAY5_2026-03-26",
      title: "PV102 Day 5 Package Index",
      artifact_type: "manifest",
      rail: "shared",
      source_kind: "archive",
      file_path:
        "CANONICAL://00_INBOX/Downloads/PV102_Day5_Print_Packet_2026-03-26.zip",
      archive_member: "",
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
      id: "agentrun_pv102_day5_draft",
      run_key: "PV102_DAY5_2026-03-26_DEMO_DRAFT",
      session_brief_id: "brief_pv102_day5",
      session_key: "PV102_DAY5_2026-03-26",
      runtime: "local_cursor_sdk",
      status: "draft_ready",
      approval_status: "waiting_review",
      draft_path:
        "CANONICAL://00_INBOX/AI_DRAFTS/INSTRUCTIONAL/PV102_DAY5_2026-03-26_DEMO_DRAFT",
      summary:
        "Sample local helper run showing the draft-then-approve workflow. Owner mode can review it; demo mode cannot see draft paths or logs.",
      started_at: "2026-03-26T09:00:00-07:00",
      finished_at: "2026-03-26T09:08:00-07:00"
    }
  ],
  helper_seed_input: `Session title: PV102 Day 5 — System sizing and safety checks
Date: 2026-03-26
Actual stage: Applied solar review day with sizing practice, safety checks, and quiz readiness

Completed:
- Students completed prior PV fundamentals and component-identification work
- Day 5 packet set was generated with instructor, student, practice, quiz, and answer-key artifacts

Remaining:
- Review voltage, current, power, and energy relationships in a solar context
- Practice basic PV system-sizing decisions using realistic loads
- Complete the Day 5 practice sheet and quiz
- Capture evidence of student reasoning and misconceptions for the next session

Blocked:
- Hands-on lab depth depends on available PV components, meters, and safe demonstration space

Student learning:
- PV sizing depends on load, sunlight assumptions, voltage, current, and safety constraints
- A safe solar plan must explain why each component and protection step belongs in the system

Evidence captured:
- Student guide
- Practice sheet
- Quiz
- Answer key with rationale
- Instructor packet

Next step: Use quiz results, practice-sheet evidence, and lab-readiness constraints to generate the next PV102 session from actual student understanding.`
};
