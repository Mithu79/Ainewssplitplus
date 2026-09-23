import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from "@/lib/i18n/locales";
import { findUserById, toPublicUser, updatePreferences } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/prefs — the signed-in user's saved preferences. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const user = await findUserById(session.user.id);
  if (!user) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  return NextResponse.json({ ok: true, user: toPublicUser(user) });
}

/** PUT /api/prefs  { locale?, region? } — update preferences; also syncs the ns-locale cookie. */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  let body: { locale?: unknown; region?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }

  const patch: { locale?: string; region?: string } = {};
  if (body.locale !== undefined) {
    if (!isLocale(body.locale)) return NextResponse.json({ ok: false, error: "invalid-locale" }, { status: 400 });
    patch.locale = body.locale;
  }
  if (body.region !== undefined) {
    if (typeof body.region !== "string") return NextResponse.json({ ok: false, error: "invalid-region" }, { status: 400 });
    patch.region = body.region;
  }

  const user = await updatePreferences(session.user.id, patch);
  if (!user) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });

  const response = NextResponse.json({ ok: true, user });
  if (patch.locale) {
    response.cookies.set(LOCALE_COOKIE, patch.locale, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }
  return response;
}
