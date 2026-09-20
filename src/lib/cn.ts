/** Tiny class-name joiner — no runtime dependency. */
export function cn(...parts: Array<string | false | null | undefined | number>): string {
  return parts.filter(Boolean).join(" ");
}
