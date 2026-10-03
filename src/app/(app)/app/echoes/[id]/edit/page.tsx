import type { Metadata } from "next";
import { EchoForm } from "@/components/echo/echo-form";
import { requireUserPage } from "@/server/auth";
import { getEchoOrNotFound } from "@/server/echo-pages";

export const metadata: Metadata = { title: "Edit Echo" };

export default async function EditEchoPage({ params }: PageProps<"/app/echoes/[id]/edit">) {
  const [user, { id }] = await Promise.all([requireUserPage(), params]);
  const echo = await getEchoOrNotFound(user.id, id);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-8 tablet:py-12">
      <h1 className="text-display-lg text-ink">Edit Echo</h1>
      <EchoForm echo={echo} cancelHref={`/app/echoes/${echo.id}`} />
    </div>
  );
}
