# Instructional Data Model V1

## Core Hierarchy

Program -> Module -> SessionBrief -> SessionBundle -> ArtifactLink

## Program

Represents the broad instructional container.

Current sample:

- `AYA_CTS`
- Institutional rail: AYA / CTS
- Facilitator framework rail: PRISM

Private-first sample:

- `PRISM_DTJL`
- Ownership rail: PRISM Core
- Visibility: `prism_private`
- Demo behavior: `public_demo_summary_only`
- Boundary: `PRISM_DTJL is PRISM Core, private-first, demo-summary-only, and not AYA implementation.`
- Repo mirror: `canonical_spine/02_PROJECTS/PRISM/programs/design-thinking-for-a-joyful-life/`

Demo mode may show only the polished overview card for `PRISM_DTJL`. It must not fetch or render source internals, evidence maps, diagnostic pattern internals, intervention library internals, owner notes, or connector/write controls.

## Module

Represents a reusable instructional unit or course sequence inside a program.

Current sample:

- `PV102`
- Applied solar systems
- Owns the session timeline

## SessionBrief

The canonical bridge artifact for one instructional day or session.

Required fields:

- `session_date`
- `actual_stage`
- `completed`
- `remaining`
- `blocked`
- `student_learning`
- `evidence_captured`
- `next_step`

Rule: generate from actual class status, not assumed pacing.

## SessionBundle

The approved package record emitted from a SessionBrief.

Contains:

- AYA delivery status
- PRISM framework status
- slide/Classroom/export preparation status
- package/readme references
- owner summary
- demo-safe summary

## ArtifactLink

Represents a file, archive member, generated output, or preview link connected to a bundle.

Visibility scopes:

- `owner_private`
- `prism_private`
- `prism_curated`
- `aya_safe`
- `demo_safe`

Rule: demo view may show `demo_safe`, `aya_safe`, and curated PRISM overview material only.

## AgentRun

Represents a local helper run, not a public cloud action.

V1 rule:

- owner-only
- local draft path references must stay out of public demo UI
- draft generation requires explicit approval before becoming canonical

## PortalTheme

Optional future record for login/branding configuration.

Fields to support later:

- `title`
- `subtitle`
- `mode_label`
- `accent_primary`
- `accent_secondary`
- `accent_tertiary`
