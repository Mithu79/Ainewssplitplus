import { LogoMark } from "@/components/Icons";
import Link from "next/link";

/** Centered card shell shared by /login and /signup. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,var(--accent-soft),transparent_70%)]"
      />
      <div className="relative mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12 sm:px-5">
        <Link href="/" className="mx-auto mb-6 flex items-center gap-2.5" aria-label="NewsSplit home">
          <LogoMark className="h-9 w-9" />
          <span className="display text-xl leading-none">
            News<span className="text-accent">Split</span>
          </span>
        </Link>
        <div className="card p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
