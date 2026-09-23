import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

/**
 * POST /api/locale   { locale: "bn" }
 * Persists the UI language in the `ns-locale` cookie for a year.
 */
export async function POST(request: NextRequest) {
  let locale: unknown;
  try {
    const body = (await request.json()) as { locale?: unknown };
    locale = body.locale;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isLocale(locale)) {
    return NextResponse.json({ ok: false, error: `Unknown locale "${String(locale)}".` }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, locale });
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });
  return response;
}
