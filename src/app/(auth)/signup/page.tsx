import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { googleConfigured } from "@/auth.config";
import { SignupForm } from "@/components/auth/SignupForm";
import { getI18n } from "@/lib/i18n/server";
import { safeCallbackUrl } from "@/lib/safe-callback";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.nav.signUp, robots: { index: false } };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(sp.callbackUrl);
  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  return <SignupForm googleEnabled={googleConfigured()} callbackUrl={callbackUrl} />;
}
