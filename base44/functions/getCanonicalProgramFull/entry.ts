// deploy-bump: 2026-05-27 — force redeploy after requireOwnerAdmin export landed in _shared/canonicalPolicy
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  nowIso,
  requireOwnerAdmin,
  safeErrorMessage,
} from "../_shared/canonicalPolicy.ts";

function getRecordList(response: unknown) {
  if (Array.isArray(response)) return response;
  const data = (response as { data?: unknown })?.data;
  if (Array.isArray(data)) return data;
  const items = (response as { items?: unknown })?.items;
  if (Array.isArray(items)) return items;
  const records = (response as { records?: unknown })?.records;
  if (Array.isArray(records)) return records;
  return [];
}

function emptyPayload(extra: Record<string, unknown> = {}) {
  return {
    success: false,
    program: null,
    modules: [],
    artifacts: [],
    warnings: [] as string[],
    timestamp: nowIso(),
    error: null as string | null,
    ...extra,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    try {
      await requireOwnerAdmin(base44);
    } catch (error) {
      return Response.json(
        emptyPayload({ error: safeErrorMessage(error) }),
        { status: 403 },
      );
    }

    const payload = await req.json().catch(() => ({}));
    const programKey = String(
      (payload as { program_key?: unknown })?.program_key || "",
    ).trim();

    if (!programKey) {
      return Response.json(
        emptyPayload({ error: "program_key is required." }),
        { status: 200 },
      );
    }

    const programResponse =
      await base44.asServiceRole.entities.CanonicalProgram.filter(
        { program_key: programKey },
        "-updated_at",
        1,
      );
    const program = getRecordList(programResponse)[0] || null;

    if (!program) {
      return Response.json(
        {
          success: true,
          program: null,
          modules: [],
          artifacts: [],
          warnings: [
            `No CanonicalProgram record found for program_key="${programKey}". Owner can seed by invoking seedPrismDtjlFromBundle (PRISM_DTJL only) or by inserting records via the Base44 console.`,
          ],
          timestamp: nowIso(),
          error: null,
        },
        { status: 200 },
      );
    }

    const modulesResponse =
      await base44.asServiceRole.entities.CanonicalModule.filter(
        { program_key: programKey },
        "-updated_at",
        200,
      );
    const modules = getRecordList(modulesResponse);

    const artifacts: unknown[] = [];
    const artifactWarnings: string[] = [];
    for (const mod of modules as Array<{ module_key?: string }>) {
      if (!mod?.module_key) continue;
      try {
        const artifactResponse =
          await base44.asServiceRole.entities.CanonicalGeneratedArtifact.filter(
            { module_key: mod.module_key },
            "-updated_at",
            100,
          );
        for (const artifact of getRecordList(artifactResponse)) {
          artifacts.push(artifact);
        }
      } catch (error) {
        artifactWarnings.push(
          `Could not load artifacts for module_key="${mod.module_key}": ${safeErrorMessage(error)}`,
        );
      }
    }

    return Response.json(
      {
        success: true,
        program,
        modules,
        artifacts,
        warnings: artifactWarnings,
        timestamp: nowIso(),
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      emptyPayload({ error: safeErrorMessage(error) }),
      { status: 200 },
    );
  }
});
