import type { Metadata } from "next";
import { EchoForm } from "@/components/echo/echo-form";
import { requireUserPage } from "@/server/auth";
import { getEchoOrNotFound } from "@/server/echo-pages";
import { getPendingRevisit } from "@/server/services/revisits";

export const metadata: Metadata = { title: "Edit Echo" };

export default async function EditEchoPage({ params }: PageProps<"/app/echoes/[id]/edit">) {
  const [user, { id }] = await Promise.all([requireUserPage(), params]);
  const [echo, revisit] = await Promise.all([
    getEchoOrNotFound(user.id, id),
    getPendingRevisit(user.id, id),
  ]);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-8 tablet:py-12">
      <h1 className="text-display-lg text-ink">Edit Echo</h1>
      <EchoForm
        echo={echo}
        revisitAt={revisit?.scheduledFor ?? null}
        timeZone={user.timezone ?? undefined}
        cancelHref={`/app/echoes/${echo.id}`}
      />
    </div>
  );
}
