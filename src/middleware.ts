import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Keeps /dashboard behind a session cookie. Unauthenticated visitors are
 * redirected to /login?callbackUrl=<original path> by Auth.js' `authorized`
 * callback (see auth.config.ts).
 *
 * Runs in the Node.js runtime (stable since Next 15.5) so the rest of the app —
 * including instrumentation, which touches node:fs — never has to be compiled
 * for the Edge runtime.
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  runtime: "nodejs",
  matcher: ["/dashboard/:path*"],
};
