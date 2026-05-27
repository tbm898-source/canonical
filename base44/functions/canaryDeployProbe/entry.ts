// Deploy probe. Returns a fixed JSON payload with a timestamp.
// Purpose: verify whether GitHub-sync deploys new base44/functions/* to the live Base44 app.
// Safe to delete once the answer is observed.
Deno.serve(() => Response.json({
  canary: "alive",
  function: "canaryDeployProbe",
  timestamp: new Date().toISOString(),
}));
