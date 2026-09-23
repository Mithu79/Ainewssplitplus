import type { NextRequest } from "next/server";
import { config } from "@/lib/config";
import { errorResponse, jsonResponse } from "@/lib/http";
import { isTranslateTarget, type TranslateTarget } from "@/lib/i18n/locales";
import { translateSegments } from "@/lib/translate";

export const dynamic = "force-dynamic";

/**
 * POST /api/translate — one-click machine translation via Google Cloud
 * Translation (v2 REST, key held server-side only).
 *
 * Body: {
 *   texts:  string[]          // titles / standfirsts, source order preserved
 *   target: "bn" | "en" | "hi"
 *   source?: string           // optional BCP-47 hint (e.g. an article's language)
 * }
 *
 * 200 → { ok: true, target, segments: [{ text, translatedText, detectedSourceLanguage? }] }
 * 400 → validation error     503 → service not configured
 * 502 → upstream failure
 */
export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Request body must be JSON.", 400);
  }

  const body = (payload ?? {}) as { texts?: unknown; target?: unknown; source?: unknown };

  if (!Array.isArray(body.texts) || body.texts.length === 0) {
    return errorResponse("`texts` must be a non-empty array of strings.", 400);
  }
  if (body.texts.length > config.translateMaxTexts) {
    return errorResponse(`At most ${config.translateMaxTexts} texts per request.`, 400);
  }
  const texts: string[] = [];
  for (const entry of body.texts) {
    if (typeof entry !== "string") return errorResponse("Every entry in `texts` must be a string.", 400);
    const trimmed = entry.trim();
    if (trimmed.length > config.translateMaxTextLength) {
      return errorResponse(`Each text must be at most ${config.translateMaxTextLength} characters.`, 400);
    }
    texts.push(trimmed);
  }

  if (!isTranslateTarget(body.target)) {
    return errorResponse(`Unknown target "${String(body.target)}".`, 400, {
      valid: ["bn", "en", "hi"],
    });
  }
  const target: TranslateTarget = body.target;

  let source: string | undefined;
  if (body.source !== undefined && body.source !== null && body.source !== "") {
    if (typeof body.source !== "string" || body.source.length > 12) {
      return errorResponse("`source` must be a short BCP-47 language tag.", 400);
    }
    source = body.source.trim().toLowerCase();
  }

  const result = await translateSegments({ texts, target, source });

  if (!result.ok) {
    const status = result.code === "not-configured" ? 503 : 502;
    return errorResponse(result.error, status, { code: result.code });
  }

  return jsonResponse({ ok: true, target, segments: result.segments });
}
