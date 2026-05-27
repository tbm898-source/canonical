export const CAPABILITY_STATUSES = {
  DEMO_ONLY: "Demo only",
  OWNER_AVAILABLE: "Owner available",
  DRY_RUN_AVAILABLE: "Dry-run available",
  LIVE_WRITE_ENABLED: "Live write enabled",
  BACKEND_DECLARED: "Backend declared but not connected",
  NOT_IMPLEMENTED: "Not implemented yet",
  BLOCKED: "Blocked",
};

export const CANONICAL_CAPABILITIES = [
  {
    key: "connector_health",
    label: "Connector health",
    functionName: "canonicalConnectorHealth",
    maturity: CAPABILITY_STATUSES.OWNER_AVAILABLE,
  },
  {
    key: "dropbox_spine_discovery",
    label: "Dropbox spine discovery",
    functionName: "canonicalSpineDiscovery",
    maturity: CAPABILITY_STATUSES.OWNER_AVAILABLE,
  },
  {
    key: "dropbox_file_list",
    label: "Dropbox metadata list",
    functionName: "canonicalDropboxFileOps",
    maturity: CAPABILITY_STATUSES.OWNER_AVAILABLE,
  },
  {
    key: "dropbox_packet_save",
    label: "Dropbox packet save",
    functionName: "saveInstructionalPacketToDropbox",
    maturity: CAPABILITY_STATUSES.LIVE_WRITE_ENABLED,
  },
  {
    key: "classroom_dry_run",
    label: "Classroom export draft",
    functionName: "prepareClassroomExport",
    maturity: CAPABILITY_STATUSES.DRY_RUN_AVAILABLE,
  },
  {
    key: "clickup_dry_run",
    label: "ClickUp task draft",
    functionName: "prepareClickUpExport",
    maturity: CAPABILITY_STATUSES.DRY_RUN_AVAILABLE,
  },
  {
    key: "gmail_send",
    label: "Gmail/email send",
    functionName: null,
    maturity: CAPABILITY_STATUSES.NOT_IMPLEMENTED,
  },
];

export function getCapabilityRegistry({
  owner = false,
  generatedPackage = null,
  acceptedSpineMap = null,
  validationOk = false,
} = {}) {
  return CANONICAL_CAPABILITIES.map((capability) => {
    if (!owner) {
      return {
        ...capability,
        available: false,
        status: CAPABILITY_STATUSES.DEMO_ONLY,
        reason: "Owner/admin login required.",
      };
    }

    if (capability.key === "dropbox_packet_save") {
      const available = Boolean(generatedPackage && acceptedSpineMap?.canonical_spine_map_id && validationOk);
      return {
        ...capability,
        available,
        status: available ? CAPABILITY_STATUSES.LIVE_WRITE_ENABLED : CAPABILITY_STATUSES.BLOCKED,
        reason: available
          ? "Approved spine map, generated packet, and safe classification are present."
          : "Requires generated packet, accepted spine map, and valid rail/visibility classification.",
      };
    }

    if (["classroom_dry_run", "clickup_dry_run"].includes(capability.key)) {
      return {
        ...capability,
        available: Boolean(generatedPackage),
        status: generatedPackage ? capability.maturity : CAPABILITY_STATUSES.BLOCKED,
        reason: generatedPackage ? "Generated packet is ready for dry-run adapter output." : "Generate a packet first.",
      };
    }

    if (capability.maturity === CAPABILITY_STATUSES.NOT_IMPLEMENTED) {
      return {
        ...capability,
        available: false,
        status: capability.maturity,
        reason: "No V1 backend action is enabled for this capability.",
      };
    }

    return {
      ...capability,
      available: true,
      status: capability.maturity,
      reason: "Available to verified owner/admin users.",
    };
  });
}
