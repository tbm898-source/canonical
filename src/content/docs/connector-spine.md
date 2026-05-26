# Connector Spine

The connector spine uses Dropbox as the discovered CANONICAL file spine.

## Discovery model

1. The spine discovery function reads Dropbox folder metadata only.
2. It does not create folders, move files, or write files during discovery.
3. The owner reviews and approves the discovered spine map before any writes occur.

## Save posture

- Demo mode: no connector calls, no real paths
- Owner preview: spine discovery allowed, save requires explicit approval
- Owner live: approved spine map unlocks artifact save

## Privacy

Connector tokens are never exposed to the frontend or demo layer. All connector calls happen in backend functions only.