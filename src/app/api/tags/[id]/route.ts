import { requireUser } from "@/server/auth";
import { apiHandler, readJson } from "@/server/http";
import { deleteTag, renameTag } from "@/server/services/tags";
import { tagUpdateSchema } from "@/server/validation/tag";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const PATCH = apiHandler<Context>(async (request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const { name } = tagUpdateSchema.parse(await readJson(request));
  return Response.json(await renameTag(user.id, id, name));
});

export const DELETE = apiHandler<Context>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteTag(user.id, id);
  return new Response(null, { status: 204 });
});
