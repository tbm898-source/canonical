# CANONICAL Program OS (Base44)

Teaching workspace for curriculum, class preparation and saved lesson drafts — synced to [Base44](https://Base44.com) via GitHub. Design Thinking teaching modules are available in the curriculum library without an owner-role requirement or demo mode.

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

Runs teaching checks, production build, then privacy QA against the fresh bundle. CI runs the same on `main`.

## Publish

1. Push to `main`
2. Open Base44 Builder → confirm sync → **Publish**
3. Run [post-deploy audit](docs/CANONICAL_Post_Deploy_Audit_Checklist_v0_1.md) and [mobile test checklist](docs/CANONICAL_Mobile_Test_Checklist_v0_1.md)

## Main routes

| Route | Who |
|-------|-----|
| `/start` | Teaching home |
| `/curriculum` | Curriculum library, including all six Design Thinking outlines |
| `/plan` | Lesson drafts, chosen dates, download and print |
| `/ProgramHelper` | Legacy bookmarks redirect to the new teaching pages; mode flags are ignored |
| `/connections` | Administrator service connection tools |
| `/OwnerAssistant` | Owner PRISM generation |
| `/Settings` | Role, connector posture, health check |
| `/Integrations` | Connector overview |

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run qa:privacy` | Teaching access and private-method bundle checks |
| `npm run qa:teaching` | Lesson draft and curriculum projection tests |
| `npm run generate:teaching` | Refresh the approved six-module teaching projection |
| `npm run qa:release` | Teaching checks + build + privacy QA |
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

- Approved Design Thinking teaching outlines: `content/teaching/design-thinking.json`, available in Curriculum
- Private method records: authenticated server functions; not included in the teaching projection
- Connected-service writes: separate administrator authorization; reading curriculum grants no write permissions
- Endpoint Pulse / FieldPulse: separate; link from Settings only

Base44 docs: [GitHub integration](https://docs.base44.com/Integrations/Using-GitHub)
