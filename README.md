# CANONICAL Program OS (Base44)

Structured operating system for instructional program memory, AYA/CTS classroom materials, and owner-private PRISM framework — synced to [Base44](https://Base44.com) via GitHub.

| | |
|---|---|
| **Base44 app ID** | `69b84417922e4d60ff8ef01c` |
| **GitHub** | `tbm898-source/canonical` |

## Quick start

```bash
npm install
```

Create `.env.local` (see [docs/CANONICAL_Env_Vars.md](docs/CANONICAL_Env_Vars.md)):

```
VITE_BASE44_APP_ID=69b84417922e4d60ff8ef01c
VITE_BASE44_APP_BASE_URL=https://your-app-slug.base44.app
```

```bash
npm run dev
```

## Release gate (before every publish)

```bash
npm run qa:release
```

Runs privacy QA (`qa:privacy`) and production build. CI runs the same on `main`.

## Publish

1. Push to `main`
2. Open Base44 Builder → confirm sync → **Publish**
3. Run [post-deploy audit](docs/CANONICAL_Post_Deploy_Audit_Checklist_v0_1.md) and [mobile test checklist](docs/CANONICAL_Mobile_Test_Checklist_v0_1.md)

## Main routes

| Route | Who |
|-------|-----|
| `/ProgramHelper?mode=demo` | Public demo |
| `/ProgramHelper?mode=owner` | Owner / admin |
| `/OwnerAssistant` | Owner PRISM generation |
| `/Settings` | Role, connector posture, health check |
| `/Integrations` | Connector overview |

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run qa:privacy` | PRISM/demo bundle privacy regression |
| `npm run qa:release` | Privacy QA + build |
| `npm run build` | Production bundle |
| `npm run sync:prism-inline` | Update inline `getCanonicalProgramFull` mirror (operator) |

## Docs index

- [Mobile platform readiness](docs/CANONICAL_Mobile_Platform_Readiness_v0_1.md)
- [Integration matrix](docs/CANONICAL_Integration_Matrix.md)
- [Connector spine v2](docs/CANONICAL_CONNECTOR_SPINE_V2.md)
- [Base44 sync notes](docs/BASE44_SYNC_AND_BACKEND_NOTES.md)
- [Agent council flow](docs/CANONICAL_Agent_Council_Flow_v0_1.md)
- [Standing context](docs/CANONICAL_Standing_Context.md)

## Boundaries

- PRISM private data: server function `getCanonicalProgramFull` only — never in public `src` bundle
- Demo mode: no backend connector calls
- Endpoint Pulse / FieldPulse: separate; link from Settings only

Base44 docs: [GitHub integration](https://docs.base44.com/Integrations/Using-GitHub)
