import { requireUser } from "@/server/auth";
import { apiHandler, readJson } from "@/server/http";
import { deleteRevisit, updateRevisit } from "@/server/services/revisits";
import { revisitUpdateSchema } from "@/server/validation/revisit";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const PATCH = apiHandler<Context>(async (request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const patch = revisitUpdateSchema.parse(await readJson(request));
  return Response.json(await updateRevisit(user.id, id, patch));
});

export const DELETE = apiHandler<Context>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteRevisit(user.id, id);
  return new Response(null, { status: 204 });
});
