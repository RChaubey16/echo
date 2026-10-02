import Link from "next/link";
import { buttonClasses } from "@/components/ui/button-classes";

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center bg-surface-soft px-4 py-12 text-ink"
    >
      <section className="w-full max-w-sm rounded-md border border-hairline-soft bg-canvas px-6 py-16 text-center">
        <h1 className="text-title-md text-ink">This page isn&apos;t here yet.</h1>
        <p className="mt-2 text-body-md text-body">
          It may not exist, or it may be coming in a later update.
        </p>
        <Link href="/app" className={buttonClasses("secondary", "mt-8")}>
          Back to Home
        </Link>
      </section>
    </main>
  );
}
