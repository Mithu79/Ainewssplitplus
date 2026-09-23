import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { googleConfigured } from "@/auth.config";
import { LoginForm } from "@/components/auth/LoginForm";
import { getI18n } from "@/lib/i18n/server";
import { safeCallbackUrl } from "@/lib/safe-callback";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.nav.signIn, robots: { index: false } };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(sp.callbackUrl);
  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  const error = typeof sp.error === "string" ? sp.error : undefined;
  return <LoginForm googleEnabled={googleConfigured()} callbackUrl={callbackUrl} initialError={error} />;
}
