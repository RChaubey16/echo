import { daysSince, track } from "@/server/analytics";
import { requireUser } from "@/server/auth";
import { apiHandler, readJson } from "@/server/http";
import { getEcho } from "@/server/services/echoes";
import { deleteRevisit, updateRevisit } from "@/server/services/revisits";
import { revisitUpdateSchema } from "@/server/validation/revisit";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const PATCH = apiHandler<Context>(async (request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const patch = revisitUpdateSchema.parse(await readJson(request));
  const revisit = await updateRevisit(user.id, id, patch);
  if ("completed" in patch) {
    const echo = await getEcho(user.id, revisit.echoId);
    track(user.id, "echo_revisited", { daysSinceSaved: daysSince(echo.savedAt) });
  }
  return Response.json(revisit);
});

export const DELETE = apiHandler<Context>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteRevisit(user.id, id);
  return new Response(null, { status: 204 });
});
