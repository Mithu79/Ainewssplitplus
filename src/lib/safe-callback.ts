/** Only allow same-origin relative paths as post-login redirect targets. */
export function safeCallbackUrl(value: string | string[] | undefined, fallback = "/dashboard"): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  return raw;
}
