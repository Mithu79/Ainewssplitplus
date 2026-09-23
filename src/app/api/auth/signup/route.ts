import { NextResponse, type NextRequest } from "next/server";
import { createUserWithPassword, UserError } from "@/lib/users";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/signup  { name?, email, password }
 * Creates an email/password account. The client then calls signIn("credentials").
 */
export async function POST(request: NextRequest) {
  let body: { name?: unknown; email?: unknown; password?: unknown; region?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name : undefined;
  const region = typeof body.region === "string" ? body.region : undefined;

  try {
    const locale = await getLocale();
    const user = await createUserWithPassword({ email, password, name, locale, region });
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    if (error instanceof UserError) {
      const status = error.code === "email-taken" ? 409 : 400;
      return NextResponse.json({ ok: false, error: error.code }, { status });
    }
    console.error("[signup]", error);
    return NextResponse.json({ ok: false, error: "server-error" }, { status: 500 });
  }
}
