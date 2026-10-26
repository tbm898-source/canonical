// Original documents are pinned to the reviewed import, outside Base44's 50 MB site archive.
const DOCUMENT_ROOT = "https://raw.githubusercontent.com/tbm898-source/canonical/b3027aedaf6f76323f33bba196709955ce6733f7/public";

export function ctsMaterialUrl(url) {
  if (!/^\/teaching\/cts\/assets\/[a-f0-9]{24}\.(pdf|docx|pptx)$/.test(url)) {
    throw new Error("Unexpected teaching document path");
  }
  return DOCUMENT_ROOT + url;
}
