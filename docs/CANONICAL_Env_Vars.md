# CANONICAL environment variables

Set in `.env.local` for local dev and in the **Base44 app environment** for production.

## Required (local dev)

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_BASE44_APP_ID` | `69b84417922e4d60ff8ef01c` | Base44 app identifier |
| `VITE_BASE44_APP_BASE_URL` | `https://your-slug.base44.app` | API / auth backend URL |

## Optional

| Variable | Purpose |
|----------|---------|
| `VITE_CANONICAL_OWNER_EMAILS` | Comma-separated allowlist when role metadata is missing |
| `VITE_ENDPOINT_PULSE_URL` | External Endpoint Pulse dashboard; link on `/Settings` only |

## Not in frontend

Connector tokens, Dropbox secrets, and OAuth material must never be set as `VITE_*` variables.
