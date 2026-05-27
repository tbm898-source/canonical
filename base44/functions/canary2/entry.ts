// canary2: isolates the "shared import" hypothesis.
// Same shape as a real backend function (imports SDK, calls base44.auth.me),
// but has NO `../_shared/` dependency. If this deploys, the workaround for
// the stuck functions is to inline shared utilities per-function.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let email: string | null = null;
    try {
      const me = await base44.auth.me();
      email = me?.email ?? null;
    } catch (_authError) {
      // best-effort; canary should still respond even if auth probe fails
    }
    return Response.json(
      {
        ok: true,
        probe: "canary2",
        email,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);
    return Response.json(
      {
        ok: false,
        probe: "canary2",
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
});
