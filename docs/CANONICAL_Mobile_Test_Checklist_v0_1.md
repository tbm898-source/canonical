# CANONICAL mobile test checklist (v0.1)

Run on **production** after Base44 publish. Pair with `npm run qa:release` locally.

## Android (Chrome)

- [ ] Home → hamburger → About, Integrations, Settings, Demo Viewer
- [ ] `/ProgramHelper?mode=demo` — no horizontal scroll; sticky demo banner while scrolling
- [ ] Workbench menu → Programs, Integrations sections scroll correctly
- [ ] Add to Home Screen / Install — icon and theme color
- [ ] Login persists after backgrounding app

## iPhone (Safari)

- [ ] Safe-area: top nav clears notch; bottom content clears home indicator
- [ ] Add to Home Screen — standalone title CANONICAL
- [ ] Modals/sheets (mobile nav) scroll and close
- [ ] Anchor links (Programs, Integrations) land below fixed nav

## Owner (signed in on device, not localhost preview)

- [ ] `/Settings` — role card shows owner; Check connectors returns statuses (no tokens)
- [ ] `/ProgramHelper` owner — PRISM panel loads
- [ ] `/OwnerAssistant` — program identity visible
- [ ] Integrations panel buttons full-width and tappable

## Demo (signed out or non-owner)

- [ ] `/Settings` — health check disabled or shows owner required
- [ ] Program Helper demo — no backend connector calls in network tab

## Pass criteria

All demo checks pass; owner checks pass for your account; no PRISM private strings in page source search (`00_GOVERNANCE`, `DIAGNOSTIC_PATTERNS`, `canonical_spine/02_PROJECTS/PRISM`).
