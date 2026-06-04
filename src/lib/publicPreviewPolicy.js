/** Routes that may load without login (demo-safe marketing and viewer surfaces). */
export const PUBLIC_PREVIEW_PATHS = [
  "/",
  "/ProgramHelper",
  "/Home",
  "/About",
  "/HowItWorks",
  "/Integrations",
  "/Proof",
  "/portfolio",
  "/Portfolio",
  "/field-proof-week1",
  "/FieldProofWeek1",
  "/Docs",
  "/WorkspaceSetup",
  "/start",
  "/admin",
  "/more",
];

export function isPublicPreviewPath(pathname = "") {
  if (PUBLIC_PREVIEW_PATHS.includes(pathname)) return true;
  return pathname.startsWith("/Packages/") || pathname.startsWith("/Docs/");
}
