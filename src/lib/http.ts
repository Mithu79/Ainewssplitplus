import { NextResponse } from "next/server";

/** Query-string helpers shared by the route handlers. */

export function intParam(value: string | null, fallback: number, min: number, max: number): number {
  if (value === null || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function stringParam(value: string | null, maxLength = 120): string | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed === "" ? undefined : trimmed;
}

export function jsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      ...(init?.headers ?? {}),
    },
  });
}

export function errorResponse(message: string, status = 400, extra: Record<string, unknown> = {}): NextResponse {
  return jsonResponse({ ok: false, error: message, ...extra }, { status });
}
