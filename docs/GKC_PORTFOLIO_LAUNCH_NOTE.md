# Portfolio Launch Note

## Project
Gordian Knot Consulting LLC AI Workflow Systems Portfolio

## Status
Merged to `main` and pushed to `origin/main`.

## Commit
`4f0d198`

## Route
`/portfolio`

## Summary
Added a public-facing portfolio page inside the CANONICAL website showing applied AI workflow systems work, including CANONICAL Program OS, Base44 to Cursor/Codex workflow, curriculum packet pipelines, field operations documentation, and AI portfolio/proof systems.

## Logo
Added real Gordian Knot Consulting LLC logo at:

`public/assets/brand/gordian-knot-consulting-llc-logo.png`

Used in the portfolio hero only.

## Checks
Passed:
- `npm run build`
- `npm run lint`
- `npm run qa:privacy`

Not run:
- `npm run typecheck`

Reason:
Existing repo-wide typecheck debt involving shared Button typing and older owner-assistant files. Not caused by portfolio work.

## Privacy Boundary
No private student names, private AYA documents, private PRISM content, sensitive workplace details, or private client details were added.

## Publish
Next live deployment step:

Base44 Builder → Publish
