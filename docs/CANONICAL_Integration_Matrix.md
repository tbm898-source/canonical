# CANONICAL Integration Matrix

Source of truth for UI: `src/lib/integrationRegistry.js` (rendered on `/Settings` and `/Integrations`).

| Integration | Current state | Role | Read/Write | Layer | Privacy risk | Next step |
|---|---|---|---|---|---|---|
| Base44 functions | GitHub sync deploy | owner / system | read + gated write | backend | medium | Post-deploy smoke |
| Dropbox | Discovery + approved map + save | owner | read; gated write | backend | high | Program Helper integrations |
| Google Classroom | Dry-run + limited live export | owner | dry-run / gated | backend | high | No PRISM in classroom exports |
| ClickUp | Dry-run + manual export | owner | dry-run / gated | backend | medium | Disable rogue automations |
| Gmail | Health check only | owner (future) | none v1 | backend | medium | No send in v1 |
| Google Calendar | Not implemented | future | — | external | low | Docs only |
| Google Drive | CTS proof labels | public proof | read metadata | frontend | low | Not Dropbox spine |
| Endpoint Pulse | Separate monitor | operator | monitor | external | low | `VITE_ENDPOINT_PULSE_URL` |
| GitHub sync | Repo → Base44 | operator | git push | external | low | Publish after QA |
| FieldPulse | Separate product | — | — | external | low | Do not merge |

Hard boundaries: demo mode never calls connectors; PRISM private data only via `getCanonicalProgramFull`; FieldPulse and Endpoint Pulse are not embedded in the app bundle.
