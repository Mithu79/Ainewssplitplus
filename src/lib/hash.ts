/**
 * Dependency-free stable hashing.
 * FNV-1a is computed twice with different offsets so ids are effectively 64-bit,
 * which keeps collisions negligible for a few thousand stories.
 */

function fnv1a(input: string, seed: number): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function hash64(input: string): string {
  const a = fnv1a(input, 0x811c9dc5);
  const b = fnv1a(`${input}::newssplit`, 0x01000193);
  return `${a.toString(36)}${b.toString(36)}`.padStart(12, "0");
}

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "cmpid",
  "cmpId",
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "yclid",
  "msclkid",
  "s_cid",
  "at_medium",
  "at_campaign",
  "at_custom1",
  "at_custom2",
  "at_custom3",
  "at_custom4",
  "at_detail",
  "at_format",
  "at_identifier",
  "at_link_id",
  "at_link_origin",
  "at_link_type",
  "at_provider",
  "at_ptr_name",
  "at_recipient_id",
  "at_recipient_list",
  "at_send_type",
  "at_term",
  "at_type",
  "at_typ_i",
  "at_viewport",
  "xtor",
  "xts",
  "ref",
  "ref_src",
  "ref_url",
  "source",
]);

/**
 * Canonical form of an article URL, used to spot the same story published
 * twice by the same outlet (different feeds, tracking parameters, anchors…).
 */
export function canonicalUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return raw.trim().toLowerCase();
  }
  url.hash = "";
  url.protocol = url.protocol.toLowerCase();
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const params = new URLSearchParams(url.search);
  for (const key of [...params.keys()]) {
    const lower = key.toLowerCase();
    if (TRACKING_PARAMS.has(lower) || lower.startsWith("utm_")) params.delete(key);
  }
  // Google News needs ?oc=5 to redirect properly; keep everything else sorted & stable.
  params.sort();
  const search = params.toString();
  let path = url.pathname.replace(/\/+$/, "");
  if (path === "") path = "/";
  return `${host}${path}${search ? `?${search}` : ""}`;
}

export function domainFromUrl(raw: string): string {
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function originFromUrl(raw: string): string {
  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

/** Short, URL-safe id derived from a canonical link. */
export function articleId(link: string): string {
  return hash64(`link:${canonicalUrl(link)}`);
}
