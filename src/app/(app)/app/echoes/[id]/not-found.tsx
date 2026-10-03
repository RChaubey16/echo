import Link from "next/link";
import { buttonClasses } from "@/components/ui/button-classes";
import { EmptyState } from "@/components/ui/empty-state";

// One message for missing and not-owned Echoes, so it reveals nothing about other users.
export default function EchoNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <EmptyState
        headingLevel="h1"
        title="This Echo doesn't exist or isn't yours."
        body="It may have been deleted, or the link may be wrong."
        action={
          <Link href="/app/echoes" className={buttonClasses("secondary")}>
            Back to your library
          </Link>
        }
      />
    </div>
  );
}
