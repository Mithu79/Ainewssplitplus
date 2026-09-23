import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig, googleConfigured } from "./auth.config";
import { findUserById, upsertOAuthUser, verifyCredentials, type AuthProvider } from "./lib/users";
import type { Locale } from "./lib/i18n/locales";

/**
 * Auth.js (NextAuth v5) — Node runtime entry point.
 *
 * - Email/password via the JSON user store (bcrypt hashes).
 * - Google OAuth when AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET are set.
 * - JWT sessions (no database adapter). The token carries the user id and
 *   provider; preferences are read from the store when needed so a save on
 *   /dashboard is visible immediately.
 */

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      provider: AuthProvider;
      locale: Locale;
      region: string;
    };
  }
  interface User {
    provider?: AuthProvider;
  }
}

const providers = [
  Credentials({
    name: "Email & password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = typeof credentials?.email === "string" ? credentials.email : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";
      if (!email || !password) return null;
      const user = await verifyCredentials(email, password);
      if (!user) return null;
      return { id: user.id, email: user.email, name: user.name, image: user.image, provider: user.provider };
    },
  }),
  ...(googleConfigured()
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const stored = await upsertOAuthUser({ email: user.email, name: user.name, image: user.image });
        user.id = stored.id;
        user.provider = stored.provider;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.provider = user.provider ?? (account?.provider === "google" ? "google" : "credentials");
      }
      return token;
    },
    async session({ session, token }) {
      const id = typeof token.sub === "string" ? token.sub : "";
      const stored = id ? await findUserById(id) : undefined;
      session.user = {
        ...session.user,
        id,
        name: stored?.name ?? session.user.name,
        email: stored?.email ?? session.user.email,
        image: stored?.image ?? session.user.image,
        provider: (stored?.provider ?? (token.provider as AuthProvider | undefined) ?? "credentials") as AuthProvider,
        locale: stored?.preferences.locale ?? "en",
        region: stored?.preferences.region ?? "",
      };
      return session;
    },
  },
});
