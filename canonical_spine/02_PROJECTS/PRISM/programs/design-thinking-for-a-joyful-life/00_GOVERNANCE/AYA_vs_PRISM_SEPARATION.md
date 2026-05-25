# AYA vs PRISM Separation

## Core rule

Generalizable curriculum and agent logic belongs to PRISM/CANONICAL core. AYA-specific implementation belongs to AYA implementation.

## PRISM_CORE examples

- Concept ontology
- Diagnostic pattern library
- Intervention library
- Generic student worksheets
- Generic facilitator guide
- Generic lesson plan structures
- Agent skills and behavior rules
- Evidence map
- Assessment schema

## AYA_IMPLEMENTATION examples

- AYA cohort schedules
- AYA staff names
- AYA classroom logistics
- AYA Google Classroom exports
- AYA-specific daily packets
- AYA internal calendars
- Student rosters or identifying details
- Local printer/location instructions

## PRIVATE_OPERATOR examples

- Base44 connector permissions
- Dropbox backend mapping
- ClickUp/Google Classroom write rules
- Internal licensing strategy
- PRISM private doctrine
- Business/legal/IP notes

## Practical test

Ask:

1. Could this be used by another youth program without changing names or logistics?
   - If yes, likely `PRISM_CORE`.

2. Does it mention AYA, CTS, a cohort, local staff, class schedule, classroom logistics, or institution-specific details?
   - If yes, likely `AYA_IMPLEMENTATION`.

3. Does it expose internal strategy, permissions, app architecture, or private operating logic?
   - If yes, likely `PRIVATE_OPERATOR`.

## Default

If unsure, tag `90_REVIEW` and do not export publicly.
