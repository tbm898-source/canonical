# Existing Typecheck Debt

## Problem
`npm run typecheck` has existing repo-wide failures, mostly involving shared Button typing and older owner-assistant files.

## Scope
This issue predates the Gordian Knot Consulting portfolio page and should be fixed separately.

## Do not combine with
- Portfolio page changes
- Logo updates
- Public content polish

## Proposed fix branch
`fix/typecheck-shared-button-owner-assistant`

## Tasks
- Inspect shared Button typing
- Identify older owner-assistant files causing inference failures
- Fix types without changing runtime behavior
- Run `npm run typecheck`
- Run `npm run build`
- Run `npm run lint`
- Run `npm run qa:privacy`
