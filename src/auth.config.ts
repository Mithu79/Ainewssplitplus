import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration.
 *
 * Contains no Node-only imports so `middleware.ts` can use it to check the
 * session cookie. Providers that need bcrypt / the filesystem are added in
 * `auth.ts`, which only runs in the Node runtime.
 */

const devSecret = "newssplit-development-only-secret-change-me";

function resolveSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production" && !process.env.VITEST) {
    console.warn(
      "[auth] AUTH_SECRET is not set — using a development-only key. Set AUTH_SECRET before exposing this deployment.",
    );
  }
  return devSecret;
}

/** Routes that need a session. Everything else stays public. */
export const PROTECTED_PREFIXES = ["/dashboard"];

export const authConfig = {
  secret: resolveSecret(),
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login", newUser: "/dashboard", error: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
      if (!isProtected) return true;
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;

export function googleConfigured(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim());
}
