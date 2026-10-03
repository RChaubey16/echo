import type { Metadata } from "next";
import { EchoForm } from "@/components/echo/echo-form";

export const metadata: Metadata = { title: "Add Echo" };

export default function NewEchoPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-8 tablet:py-12">
      <h1 className="text-display-lg text-ink">Add Echo</h1>
      <EchoForm cancelHref="/app/echoes" />
    </div>
  );
}
