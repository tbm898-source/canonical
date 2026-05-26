# Connector Spine

Connectors are adapters around CANONICAL. They are not the source of truth.

## Current Connector Posture

- Dropbox: first live file-spine candidate after discovery and owner approval.
- Google Classroom: prepared adapter for classroom-safe drafts.
- ClickUp: prepared adapter for tasks, KPI candidates, and operational follow-up.
- Gmail / email: future communication adapter.

## Public Safety

Demo and public pages do not call backend connectors, show private connector material, expose local paths, or trigger live writes.

Live writes require owner mode, safe classification, accepted spine mapping, and explicit approval.
