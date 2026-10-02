import type { Metadata } from "next";
import Link from "next/link";
import { ADD_ECHO_HREF } from "@/components/shell/nav-items";
import { buttonClasses } from "@/components/ui/button-classes";
import { QuoteMarksIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Home" };

// Phase 1 has no Echoes yet, so Home is always the first-run state.
export default function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <section className="w-full max-w-sm rounded-md border border-hairline-soft bg-canvas px-6 py-16 text-center">
        <QuoteMarksIcon className="mx-auto h-12 w-12 text-muted" />
        <h1 className="mt-6 text-title-md text-ink">Welcome to Echo.</h1>
        <p className="mt-2 text-body-md text-body">Save the words you don&apos;t want to forget.</p>
        <Link href={ADD_ECHO_HREF} className={buttonClasses("primary", "mt-8")}>
          Add your first Echo
        </Link>
      </section>
    </div>
  );
}
